# Git Hooks

This directory contains Git hooks that run automatically at various points in the Git workflow.

## Available Hooks

### pre-push

Runs before code is pushed to remote. Performs quality checks including:

- **Type checking** - Validates TypeScript types
- **Linting** - Checks code style and best practices
- **Unit tests** - Runs all unit tests

Only runs checks for changed apps/services to keep the process fast.

## Setup

### Automatic Setup

The hooks are automatically configured in the dev container post-create script.

### Manual Setup

If you need to manually set up the hooks:

```bash
# Configure Git to use the .githooks directory
git config core.hooksPath .githooks

# Make hooks executable
chmod +x .githooks/*
```

## Bypassing Hooks

**Not recommended**, but if you need to bypass the pre-push hook in an emergency:

```bash
git push --no-verify
```

## Troubleshooting

### Hook not running

Check that Git is configured to use the hooks directory:

```bash
git config core.hooksPath
# Should output: .githooks
```

### Permission denied

Make sure the hook is executable:

```bash
chmod +x .githooks/pre-push
```

### False positives

If the hook is failing but you believe your code is correct:

1. Run the checks manually:
   ```bash
   cd apps/landing-page
   pnpm run type-check
   pnpm run lint
   pnpm run test:unit
   ```

2. Fix any issues found
3. If using `lint:fix` doesn't resolve linting issues, check your code formatting

## Adding New Hooks

When adding new hooks:

1. Create the hook file in `.githooks/`
2. Make it executable: `chmod +x .githooks/hook-name`
3. Update this README with documentation
4. Test thoroughly before committing

## Benefits

- **Catch issues early** - Find problems before they reach CI/CD
- **Save time** - No waiting for GitHub Actions to fail
- **Save resources** - Reduce unnecessary CI/CD runs
- **Better commits** - Ensure quality before pushing
- **Team consistency** - Everyone runs the same checks
