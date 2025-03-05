import { readFileSync } from 'fs';

interface SSLConfig {
    certfile: string | null;
    keyfile: string | null;
}

export function get_ssl_config(): SSLConfig {
    const config: SSLConfig = {
        certfile: process.env.SSL_CERT_FILE || null,
        keyfile: process.env.SSL_KEY_FILE || null,
    };

    if (config.certfile && config.keyfile) {
        try {
            readFileSync(config.certfile);
            readFileSync(config.keyfile);
            return config;
        } catch (error) {
            console.error('Error reading SSL certificate files:', error);
            return { certfile: null, keyfile: null };
        }
    }

    return { certfile: null, keyfile: null };
}

export function has_ssl_config(): boolean {
    const { certfile, keyfile } = get_ssl_config();
    return certfile !== null && keyfile !== null;
}
