interface Repository<Schema> {
    create: (item: Schema) => Promise<void>;
    update: (item: Schema) => Promise<void>;
    delete: (item: { id: string }) => Promise<void>;
    subscribe: (callback: (updatedItems: Schema[]) => void) => void;
    unsubscribe: () => void;
}