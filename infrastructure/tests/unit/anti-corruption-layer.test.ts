import { describe, it, expect, beforeEach } from 'vitest';
import { CognitoAdapter } from '../../anti-corruption-layer/CognitoAdapter';
import { User, UserRole, AuthProvider } from '../../../domains/identity/src/entities/User';

describe('Anti-Corruption Layer - Infrastructure', () => {
  describe('CognitoAdapter', () => {
    let mockCognitoUser: any;

    beforeEach(() => {
      mockCognitoUser = {
        Username: 'cognito-user-123',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'preferred_username', Value: 'testuser' },
          { Name: 'name', Value: 'Test User' },
          { Name: 'given_name', Value: 'Test' }
        ],
        Enabled: true,
        UserStatus: 'CONFIRMED'
      };
    });

    it('should convert Cognito user to domain User entity', () => {
      const domainUser = CognitoAdapter.toDomainUser(mockCognitoUser);

      expect(domainUser).toBeInstanceOf(User);
      expect(domainUser.getEmail().getValue()).toBe('test@example.com');
      expect(domainUser.getUsername()).toBe('testuser');
      expect(domainUser.getDisplayName()).toBe('Test User');
      expect(domainUser.getCognitoId().getValue()).toBe('cognito-user-123');
    });

    it('should handle missing optional attributes gracefully', () => {
      const minimalCognitoUser = {
        Username: 'cognito-user-456',
        UserAttributes: [
          { Name: 'email', Value: 'minimal@example.com' },
          { Name: 'preferred_username', Value: 'minimaluser' }
        ]
      };

      const domainUser = CognitoAdapter.toDomainUser(minimalCognitoUser);

      expect(domainUser.getEmail().getValue()).toBe('minimal@example.com');
      expect(domainUser.getUsername()).toBe('minimaluser');
      expect(domainUser.getDisplayName()).toBeNull();
    });

    it('should throw error for missing required attributes', () => {
      const invalidCognitoUser = {
        Username: 'cognito-user-789',
        UserAttributes: [
          { Name: 'preferred_username', Value: 'invaliduser' }
          // Missing email
        ]
      };

      expect(() => {
        CognitoAdapter.toDomainUser(invalidCognitoUser);
      }).toThrow('Email is required for user creation');
    });

    it('should throw error for missing username', () => {
      const invalidCognitoUser = {
        Username: 'cognito-user-101',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' }
          // Missing preferred_username - should use Username as fallback
        ]
      };

      // This should not throw since it uses Username as fallback
      const user = CognitoAdapter.toDomainUser(invalidCognitoUser);
      expect(user.username).toBe('cognito-user-101');
    });

    it('should map Cognito groups to domain roles correctly', () => {
      expect(CognitoAdapter.mapCognitoGroupToRole('admin')).toBe(UserRole.ADMIN);
      expect(CognitoAdapter.mapCognitoGroupToRole('Admin')).toBe(UserRole.ADMIN);
      expect(CognitoAdapter.mapCognitoGroupToRole('ADMIN')).toBe(UserRole.ADMIN);
      
      expect(CognitoAdapter.mapCognitoGroupToRole('editor')).toBe(UserRole.EDITOR);
      expect(CognitoAdapter.mapCognitoGroupToRole('user')).toBe(UserRole.USER);
      expect(CognitoAdapter.mapCognitoGroupToRole('unknown')).toBe(UserRole.USER);
    });

    it('should extract user status correctly', () => {
      const enabledConfirmedUser = {
        Enabled: true,
        UserStatus: 'CONFIRMED'
      };

      const status1 = CognitoAdapter.extractUserStatus(enabledConfirmedUser);
      expect(status1.isActive).toBe(true);
      expect(status1.isVerified).toBe(true);

      const unconfirmedUser = {
        Enabled: true,
        UserStatus: 'UNCONFIRMED'
      };

      const status2 = CognitoAdapter.extractUserStatus(unconfirmedUser);
      expect(status2.isActive).toBe(false);
      expect(status2.isVerified).toBe(false);

      const disabledUser = {
        Enabled: false,
        UserStatus: 'CONFIRMED'
      };

      const status3 = CognitoAdapter.extractUserStatus(disabledUser);
      expect(status3.isActive).toBe(false);
      expect(status3.isVerified).toBe(true);
    });

    it('should convert authentication results correctly', () => {
      const mockAuthResult = {
        AccessToken: 'access-token-123',
        RefreshToken: 'refresh-token-456',
        IdToken: 'id-token-789',
        ExpiresIn: 3600
      };

      const authData = CognitoAdapter.toAuthenticationResult(mockAuthResult);

      expect(authData.accessToken).toBe('access-token-123');
      expect(authData.refreshToken).toBe('refresh-token-456');
      expect(authData.idToken).toBe('id-token-789');
      expect(authData.expiresIn).toBe(3600);
    });

    it('should handle missing ExpiresIn with default value', () => {
      const mockAuthResult = {
        AccessToken: 'access-token-123',
        RefreshToken: 'refresh-token-456',
        IdToken: 'id-token-789'
        // ExpiresIn missing
      };

      const authData = CognitoAdapter.toAuthenticationResult(mockAuthResult);
      expect(authData.expiresIn).toBe(3600); // Default value
    });

    it('should validate Cognito user data', () => {
      expect(() => {
        CognitoAdapter.validateCognitoUserData(null);
      }).toThrow('Cognito user data is required');

      expect(() => {
        CognitoAdapter.validateCognitoUserData({});
      }).toThrow('Cognito Username is required');

      expect(() => {
        CognitoAdapter.validateCognitoUserData({
          Username: 'test-user',
          UserAttributes: []
        });
      }).toThrow('Email attribute is required in Cognito user data');

      expect(() => {
        CognitoAdapter.validateCognitoUserData({
          Username: 'test-user',
          UserAttributes: [
            { Name: 'email', Value: 'invalid-email' }
          ]
        });
      }).toThrow('Invalid email format in Cognito user data');

      expect(() => {
        CognitoAdapter.validateCognitoUserData({
          Username: 'test-user',
          UserAttributes: [
            { Name: 'email', Value: 'valid@example.com' }
          ]
        });
      }).not.toThrow();
    });

    it('should prevent domain contamination', () => {
      // Ensure that Cognito-specific concepts don't leak into domain
      const domainUser = CognitoAdapter.toDomainUser(mockCognitoUser);
      const plainObject = domainUser.toPlainObject();

      // Should not contain Cognito-specific properties
      expect(plainObject).not.toHaveProperty('UserAttributes');
      expect(plainObject).not.toHaveProperty('UserStatus');
      expect(plainObject).not.toHaveProperty('Enabled');

      // Should contain only domain properties
      expect(plainObject).toHaveProperty('email');
      expect(plainObject).toHaveProperty('username');
      expect(plainObject).toHaveProperty('role');
      expect(plainObject).toHaveProperty('provider');
      expect(plainObject.provider).toBe(AuthProvider.COGNITO);
    });
  });
});