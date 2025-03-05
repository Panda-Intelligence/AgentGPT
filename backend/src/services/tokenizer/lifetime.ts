import { TokenService } from './token_service';

export class TokenServiceLifetime {
    private static instance: TokenService | null = null;

    private constructor() {
        // Private constructor to prevent direct construction calls with 'new'
    }

    public static get_instance(): TokenService {
        if (!TokenServiceLifetime.instance) {
            TokenServiceLifetime.instance = new TokenService();
        }
        return TokenServiceLifetime.instance;
    }

    public static on_startup(): void {
        TokenServiceLifetime.get_instance();
    }

    public static on_shutdown(): void {
        TokenServiceLifetime.instance = null;
    }
}
