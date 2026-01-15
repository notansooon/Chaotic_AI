import Conf from 'conf';

interface KyntrixConfig {
    apiKey?: string;
    apiUrl: string;
}

const store = new Conf<KyntrixConfig>({
    projectName: 'kyntrix',
    defaults: {
        apiUrl: 'https://api.kyntrix.io'
    }
});

export function getConfig(): KyntrixConfig {
    return {
        apiKey: process.env.KYNTRIX_API_KEY || store.get('apiKey'),
        apiUrl: process.env.KYNTRIX_API_URL || store.get('apiUrl')
    };
}

export function setApiKey(key: string): void {
    store.set('apiKey', key);
}

export function setApiUrl(url: string): void {
    store.set('apiUrl', url);
}

export function clearConfig(): void {
    store.clear();
}
