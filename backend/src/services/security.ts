import { createHash } from 'crypto';

export function get_password_hash(password: string): string {
    return createHash('sha256').update(password).digest('hex');
}

export function verify_password(plain_password: string, hashed_password: string): boolean {
    return get_password_hash(plain_password) === hashed_password;
}

export function create_api_client_token(
    user_id: string,
    expiry: Date,
    secret: string
): string {
    const message = `${user_id}:${expiry.getTime()}`;
    return createHash('sha256')
        .update(message)
        .update(secret)
        .digest('hex');
}

export function verify_api_client_token(
    token: string,
    user_id: string,
    expiry: Date,
    secret: string
): boolean {
    return token === create_api_client_token(user_id, expiry, secret);
}
