# QIS Data Management Domain - Class Diagrams

## Domain Model Class Diagram

```mermaid
classDiagram
    class ReferenceData {
        -referenceDataId: ReferenceDataId
        -dataSchema: DataSchema
        -sources: DataSource[]
        -publishedValues: Map~Snap, OfficialDataValue~
        -qualityMetrics: QualityMetrics
        -auditTrail: AuditTrail
        -publicationStatus: PublicationStatus
        -subscribers: Subscriber[]
        +ingestData(sourceId: DataSourceId, snap: Snap, rawData: any): void
        +reconcileData(snap: Snap): ReconciliationResult
        +publishData(snap: Snap, approver: UserId): void
        +restateData(snap: Snap, correctedValue: any, reason: string): void
        +getOfficialValue(snap: Snap): OfficialDataValue
        +getAsOfTimeValue(snap: Snap, asOfTime: Date): AsOfTimeValue
        +calculateQualityMetrics(timeWindow: TimeWindow): QualityMetrics
        +validateDataSchema(rawData: any): ValidationResult
    }

    class DataSource {
        -sourceId: DataSourceId
        -providerInfo: ProviderInfo
        -connectionConfig: ConnectionConfig
        -healthStatus: HealthStatus
        -costMetrics: CostMetrics
        -dataValues: Map~Snap, SourceDataValue~
        -rateLimits: RateLimitConfig
        +connect(): Connection
        +disconnect(): void
        +subscribe(referenceDataId: ReferenceDataId): AsyncIterator~RawData~
        +requestHistorical(request: HistoricalRequest): Promise~RawData[]~
        +validateConnection(): HealthCheckResult
        +updateHealthStatus(status: HealthStatus): void
        +trackCosts(usage: UsageMetrics): void
    }

    class OfficialDataValue {
        -value: DataValue~T~
        -snap: Snap
        -quality: QualityScore
        -publicationTime: Date
        -version: number
        -reconciliationDetails: ReconciliationDetails
        -approver: UserId
        +getValue(): T
        +getQualityScore(): QualityScore
        +isPublished(): boolean
        +getVersion(): number
        +getReconciliationSources(): DataSourceId[]
    }

    class DataValue~T~ {
        <<abstract>>
        -rawValue: T
        -dataType: DataType
        -precision: Precision
        -unit: Unit
        -currency: Currency
        -timezone: TimeZone
        +getValue(): T
        +getDataType(): DataType
        +validate(): ValidationResult
        +normalize(): NormalizedValue
        +convert(targetUnit: Unit): DataValue~T~
    }

    class PrimitiveDataValue~T~ {
        +getValue(): T
        +validate(): ValidationResult
        +compare(other: PrimitiveDataValue~T~): number
    }

    class ComplexDataValue~T~ {
        -schema: DataSchema
        -nestedValues: Map~string, DataValue~any~~
        +getValue(): T
        +getSchema(): DataSchema
        +getNestedValue(path: string): DataValue~any~
        +validateSchema(): ValidationResult
        +flatten(): Map~string, any~
    }

    class DoubleDataValue {
        +getValue(): number
        +getPrecision(): number
        +round(decimals: number): DoubleDataValue
    }

    class StringDataValue {
        +getValue(): string
        +getLength(): number
        +trim(): StringDataValue
    }

    class OptionsUniverseDataValue {
        -underlyingSymbol: string
        -expirationDate: Date
        -strikes: Strike[]
        -optionContracts: OptionContract[]
        +getUnderlyingSymbol(): string
        +getStrikes(): Strike[]
        +getOptionsForStrike(strike: number): OptionContract[]
        +getImpliedVolatilitySurface(): VolatilitySurface
    }

    ReferenceData ||--o{ DataSource : manages
    ReferenceData ||--o{ OfficialDataValue : publishes
    OfficialDataValue ||--|| DataValue : contains
    DataValue <|-- PrimitiveDataValue
    DataValue <|-- ComplexDataValue
    PrimitiveDataValue <|-- DoubleDataValue
    PrimitiveDataValue <|-- StringDataValue
    ComplexDataValue <|-- OptionsUniverseDataValue
```

## Value Objects Class Diagram

```mermaid
classDiagram
    class ReferenceDataId {
        -value: string
        -category: DataCategory
        -subcategory: string
        +toString(): string
        +equals(other: ReferenceDataId): boolean
        +getCategory(): DataCategory
        +validate(): ValidationResult
    }

    class Snap {
        -eventTime: Date
        -precision: TimePrecision
        -timezone: TimeZone
        +getEventTime(): Date
        +getTimestamp(): number
        +toISO(): string
        +toUTC(): Date
        +equals(other: Snap): boolean
        +isBefore(other: Snap): boolean
        +isAfter(other: Snap): boolean
    }

    class DataSchema {
        -schemaId: SchemaId
        -version: SchemaVersion
        -definition: JSONSchema
        -fields: SchemaField[]
        -constraints: SchemaConstraint[]
        +validate(data: any): ValidationResult
        +evolve(newDefinition: JSONSchema): DataSchema
        +getFields(): SchemaField[]
        +isCompatible(other: DataSchema): boolean
        +generateDocumentation(): SchemaDocumentation
    }

    class QualityScore {
        -accuracy: number
        -completeness: number
        -timeliness: number
        -consistency: number
        -overallScore: number
        +getOverallScore(): number
        +getComponentScores(): ComponentScores
        +isAcceptable(threshold: number): boolean
        +compare(other: QualityScore): number
    }

    class AuditEntry {
        -entryId: AuditEntryId
        -timestamp: Date
        -userId: UserId
        -action: AuditAction
        -resource: ResourceIdentifier
        -details: AuditDetails
        -result: ActionResult
        +getTimestamp(): Date
        +getUser(): UserId
        +getAction(): AuditAction
        +wasSuccessful(): boolean
    }

    class Price {
        -amount: number
        -currency: Currency
        -precision: number
        -priceType: PriceType
        +getAmount(): number
        +getCurrency(): Currency
        +convertTo(targetCurrency: Currency, exchangeRate: number): Price
        +add(other: Price): Price
        +multiply(factor: number): Price
    }

    class Volume {
        -quantity: number
        -unit: VolumeUnit
        -precision: number
        +getQuantity(): number
        +getUnit(): VolumeUnit
        +convertTo(targetUnit: VolumeUnit): Volume
        +add(other: Volume): Volume
    }

    class Strike {
        -strikePrice: Price
        -moneyness: Moneyness
        +getStrikePrice(): Price
        +getMoneyness(): Moneyness
        +isInTheMoney(spotPrice: Price): boolean
        +isOutOfTheMoney(spotPrice: Price): boolean
    }
```

## Aggregate and Entity Relationships

```mermaid
classDiagram
    class ReferenceDataAggregate {
        <<aggregate root>>
        -referenceData: ReferenceData
        -domainEvents: DomainEvent[]
        +handle(command: IngestDataCommand): void
        +handle(command: ReconcileDataCommand): void
        +handle(command: PublishDataCommand): void
        +handle(command: RestateDataCommand): void
        +getUncommittedEvents(): DomainEvent[]
        +markEventsAsCommitted(): void
        +applyEvent(event: DomainEvent): void
    }

    class DataSourceAggregate {
        <<aggregate root>>
        -dataSource: DataSource
        -domainEvents: DomainEvent[]
        +handle(command: RegisterSourceCommand): void
        +handle(command: UpdateSourceCommand): void
        +handle(command: DeactivateSourceCommand): void
        +getUncommittedEvents(): DomainEvent[]
        +markEventsAsCommitted(): void
    }

    class ReconciliationService {
        <<domain service>>
        -reconciliationRules: ReconciliationRule[]
        -conflictResolver: ConflictResolver
        +reconcileValues(sourceValues: SourceDataValue[]): ReconciliationResult
        +resolveConflicts(conflicts: DataConflict[]): ConflictResolution[]
        +calculateConfidence(reconciliationResult: ReconciliationResult): number
    }

    class QualityAssessmentService {
        <<domain service>>
        -qualityRules: QualityRule[]
        -benchmarkData: BenchmarkData
        +assessQuality(dataValue: DataValue, historicalData: DataValue[]): QualityScore
        +detectAnomalies(timeSeries: TimeSeries): Anomaly[]
        +generateQualityReport(referenceDataId: ReferenceDataId, timeWindow: TimeWindow): QualityReport
    }

    class PublicationService {
        <<domain service>>
        -publicationRules: PublicationRule[]
        -approvalWorkflow: ApprovalWorkflow
        +canPublish(officialDataValue: OfficialDataValue): boolean
        +publishData(officialDataValue: OfficialDataValue, approver: UserId): PublicationResult
        +schedulePublication(publicationRequest: PublicationRequest): void
    }

    ReferenceDataAggregate ||--|| ReferenceData
    DataSourceAggregate ||--|| DataSource
    ReferenceDataAggregate ..> ReconciliationService : uses
    ReferenceDataAggregate ..> QualityAssessmentService : uses
    ReferenceDataAggregate ..> PublicationService : uses
```

## Repository Interfaces

```mermaid
classDiagram
    class IReferenceDataRepository {
        <<interface>>
        +save(aggregate: ReferenceDataAggregate): Promise~void~
        +getById(id: ReferenceDataId): Promise~ReferenceDataAggregate~
        +getByCategory(category: DataCategory): Promise~ReferenceDataAggregate[]~
        +exists(id: ReferenceDataId): Promise~boolean~
        +delete(id: ReferenceDataId): Promise~void~
    }

    class IDataSourceRepository {
        <<interface>>
        +save(aggregate: DataSourceAggregate): Promise~void~
        +getById(id: DataSourceId): Promise~DataSourceAggregate~
        +getByProvider(provider: DataProvider): Promise~DataSourceAggregate[]~
        +getActiveources(): Promise~DataSourceAggregate[]~
        +exists(id: DataSourceId): Promise~boolean~
    }

    class IEventStore {
        <<interface>>
        +saveEvents(streamId: StreamId, events: DomainEvent[], expectedVersion: number): Promise~void~
        +getEvents(streamId: StreamId): Promise~DomainEvent[]~
        +getEvents(streamId: StreamId, fromVersion: number): Promise~DomainEvent[]~
        +getEventsByType(eventType: string): Promise~DomainEvent[]~
        +getAllEvents(): AsyncIterator~DomainEvent~
    }

    class PostgreSQLReferenceDataRepository {
        -eventStore: IEventStore
        -snapshotStore: ISnapshotStore
        +save(aggregate: ReferenceDataAggregate): Promise~void~
        +getById(id: ReferenceDataId): Promise~ReferenceDataAggregate~
        +buildAggregateFromEvents(events: DomainEvent[]): ReferenceDataAggregate
    }

    class PostgreSQLEventStore {
        -connection: DatabaseConnection
        +saveEvents(streamId: StreamId, events: DomainEvent[], expectedVersion: number): Promise~void~
        +getEvents(streamId: StreamId): Promise~DomainEvent[]~
        +handleConcurrencyConflict(streamId: StreamId, expectedVersion: number): Promise~void~
    }

    IReferenceDataRepository <|.. PostgreSQLReferenceDataRepository
    IDataSourceRepository <|.. PostgreSQLDataSourceRepository
    IEventStore <|.. PostgreSQLEventStore
    PostgreSQLReferenceDataRepository ..> IEventStore : uses
```

## Command and Query Models (CQRS)

```mermaid
classDiagram
    class Command {
        <<abstract>>
        -commandId: CommandId
        -timestamp: Date
        -userId: UserId
        +getCommandId(): CommandId
        +getTimestamp(): Date
        +getUserId(): UserId
    }

    class IngestDataCommand {
        -referenceDataId: ReferenceDataId
        -sourceId: DataSourceId
        -snap: Snap
        -rawData: any
        -metadata: IngestionMetadata
        +getReferenceDataId(): ReferenceDataId
        +getSourceId(): DataSourceId
        +getRawData(): any
    }

    class ReconcileDataCommand {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -reconciliationRules: ReconciliationRule[]
        +getReferenceDataId(): ReferenceDataId
        +getSnap(): Snap
        +getRules(): ReconciliationRule[]
    }

    class PublishDataCommand {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -approver: UserId
        -publicationReason: string
        +getReferenceDataId(): ReferenceDataId
        +getApprover(): UserId
    }

    class Query {
        <<abstract>>
        -queryId: QueryId
        -timestamp: Date
        -userId: UserId
        +getQueryId(): QueryId
        +getTimestamp(): Date
    }

    class GetOfficialDataQuery {
        -referenceDataId: ReferenceDataId
        -snapRange: SnapRange
        -includeQuality: boolean
        +getReferenceDataId(): ReferenceDataId
        +getSnapRange(): SnapRange
    }

    class GetAsOfTimeQuery {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -asOfTime: Date
        +getReferenceDataId(): ReferenceDataId
        +getAsOfTime(): Date
    }

    class GetQualityMetricsQuery {
        -referenceDataId: ReferenceDataId
        -timeWindow: TimeWindow
        -metricTypes: QualityMetricType[]
        +getReferenceDataId(): ReferenceDataId
        +getTimeWindow(): TimeWindow
    }

    Command <|-- IngestDataCommand
    Command <|-- ReconcileDataCommand
    Command <|-- PublishDataCommand
    Query <|-- GetOfficialDataQuery
    Query <|-- GetAsOfTimeQuery
    Query <|-- GetQualityMetricsQuery
```

## Event Model

```mermaid
classDiagram
    class DomainEvent {
        <<abstract>>
        -eventId: EventId
        -aggregateId: AggregateId
        -aggregateType: string
        -eventType: string
        -eventTimestamp: Date
        -eventVersion: number
        -userId: UserId
        +getEventId(): EventId
        +getAggregateId(): AggregateId
        +getEventType(): string
    }

    class DataIngested {
        -referenceDataId: ReferenceDataId
        -sourceId: DataSourceId
        -snap: Snap
        -rawData: any
        -ingestionMetadata: IngestionMetadata
        +getReferenceDataId(): ReferenceDataId
        +getSourceId(): DataSourceId
        +getRawData(): any
    }

    class DataValidated {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -validatedData: DataValue
        -validationResults: ValidationResult[]
        +getValidatedData(): DataValue
        +getValidationResults(): ValidationResult[]
    }

    class DataReconciled {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -reconciliationResult: ReconciliationResult
        -sourceValues: Map~DataSourceId, DataValue~
        -conflicts: DataConflict[]
        +getReconciliationResult(): ReconciliationResult
        +getSourceValues(): Map~DataSourceId, DataValue~
    }

    class DataPublished {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -officialDataValue: OfficialDataValue
        -approver: UserId
        -subscribers: Subscriber[]
        +getOfficialDataValue(): OfficialDataValue
        +getApprover(): UserId
    }

    class DataRestated {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -originalValue: OfficialDataValue
        -correctedValue: OfficialDataValue
        -reason: string
        -approver: UserId
        +getOriginalValue(): OfficialDataValue
        +getCorrectedValue(): OfficialDataValue
        +getReason(): string
    }

    class QualityIssueDetected {
        -referenceDataId: ReferenceDataId
        -snap: Snap
        -qualityIssues: QualityIssue[]
        -severity: Severity
        -recommendedActions: RecommendedAction[]
        +getQualityIssues(): QualityIssue[]
        +getSeverity(): Severity
    }

    DomainEvent <|-- DataIngested
    DomainEvent <|-- DataValidated
    DomainEvent <|-- DataReconciled
    DomainEvent <|-- DataPublished
    DomainEvent <|-- DataRestated
    DomainEvent <|-- QualityIssueDetected
```

## External Integration Models

```mermaid
classDiagram
    class DataProvider {
        <<interface>>
        +connect(): Promise~Connection~
        +disconnect(): Promise~void~
        +subscribe(referenceDataId: ReferenceDataId): AsyncIterator~RawData~
        +requestHistorical(request: HistoricalRequest): Promise~RawData[]~
        +getHealth(): Promise~HealthStatus~
        +getRateLimits(): RateLimitInfo
        +getCosts(): CostInfo
    }

    class BloombergProvider {
        -apiClient: BloombergAPIClient
        -connectionConfig: BloombergConfig
        -rateLimiter: RateLimiter
        +connect(): Promise~Connection~
        +subscribe(referenceDataId: ReferenceDataId): AsyncIterator~RawData~
        +mapToInternalFormat(bloombergData: any): RawData
        +handleBloombergError(error: BloombergError): void
    }

    class CoinGeckoProvider {
        -httpClient: HTTPClient
        -apiKey: string
        -rateLimiter: RateLimiter
        +connect(): Promise~Connection~
        +subscribe(referenceDataId: ReferenceDataId): AsyncIterator~RawData~
        +mapCryptoPriceData(coinGeckoData: any): RawData
        +handleRateLimit(): void
    }

    class IEXProvider {
        -webSocketClient: WebSocketClient
        -restClient: RESTClient
        -subscriptions: Map~string, Subscription~
        +connect(): Promise~Connection~
        +subscribe(referenceDataId: ReferenceDataId): AsyncIterator~RawData~
        +handleMarketData(iexData: any): RawData
        +manageSubscriptions(): void
    }

    class ProviderAdapter {
        -provider: DataProvider
        -mapper: DataMapper
        -errorHandler: ErrorHandler
        +adapt(rawData: any): DataValue
        +handleProviderError(error: ProviderError): void
        +normalizeTimestamp(timestamp: any): Snap
        +validateProviderData(data: any): ValidationResult
    }

    DataProvider <|.. BloombergProvider
    DataProvider <|.. CoinGeckoProvider
    DataProvider <|.. IEXProvider
    ProviderAdapter ..> DataProvider : uses
```

These class diagrams provide a comprehensive view of the QIS Data Management domain's structure, showing the relationships between aggregates, entities, value objects, services, and external integrations. The design follows DDD principles with clear bounded contexts and strong encapsulation of business logic.