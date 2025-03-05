import axios from 'axios';
import { FastifyRequest } from 'fastify';
import { Settings } from '../settings';
import { encryption_service } from './security';

export interface UserBase {
  id: string;
  // Add other user properties as needed
}

export interface OAuthCredentials {
  access_token_enc: string;
  refresh_token_enc: string;
  access_token_expiration: Date;
  state: string;
  save: (session: any) => Promise<OAuthCredentials>;
}

export interface OAuthCrud {
  session: any;
  get_installation_by_user_id: (userId: string, provider: string) => Promise<OAuthCredentials | null>;
  get_installation_by_state: (state: string) => Promise<OAuthCredentials | null>;
  create_installation: (user: UserBase, provider: string, redirectUri: string) => Promise<OAuthCredentials>;
}

abstract class OAuthInstaller {
  protected crud: OAuthCrud;
  protected settings: Settings;

  constructor(crud: OAuthCrud, settings: Settings) {
    this.crud = crud;
    this.settings = settings;
  }

  abstract install(user: UserBase, redirectUri: string): Promise<string>;
  abstract installCallback(code: string, state: string): Promise<OAuthCredentials>;
  abstract uninstall(user: UserBase): Promise<boolean>;

  protected static storeAccessToken(creds: OAuthCredentials, accessToken: string): void {
    creds.access_token_enc = encryption_service.encrypt(accessToken);
  }

  protected static storeRefreshToken(creds: OAuthCredentials, refreshToken: string): void {
    creds.refresh_token_enc = encryption_service.encrypt(refreshToken);
  }
}

class SIDInstaller extends OAuthInstaller {
  private static readonly PROVIDER = 'sid';

  async install(user: UserBase, redirectUri: string): Promise<string> {
    // Gracefully handle the case where the installation already exists
    let installation = await this.crud.get_installation_by_user_id(
      user.id,
      SIDInstaller.PROVIDER
    );

    if (!installation) {
      installation = await this.crud.create_installation(
        user,
        SIDInstaller.PROVIDER,
        redirectUri
      );
    }

    const scopes = ['data:query', 'offline_access'];
    const params = new URLSearchParams({
      client_id: this.settings.sid_client_id,
      redirect_uri: this.settings.sid_redirect_uri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: installation.state,
      audience: 'https://api.sid.ai/api/v1/',
    });

    return `https://me.sid.ai/api/oauth/authorize?${params.toString()}`;
  }

  async installCallback(code: string, state: string): Promise<OAuthCredentials> {
    const creds = await this.crud.get_installation_by_state(state);
    if (!creds) {
      throw new Error('Forbidden');
    }

    const req = {
      grant_type: 'authorization_code',
      client_id: this.settings.sid_client_id,
      client_secret: this.settings.sid_client_secret,
      redirect_uri: this.settings.sid_redirect_uri,
      code,
    };

    const response = await axios.post('https://auth.sid.ai/oauth/token', req, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const resData = response.data;

    OAuthInstaller.storeAccessToken(creds, resData.access_token);
    OAuthInstaller.storeRefreshToken(creds, resData.refresh_token);
    creds.access_token_expiration = new Date(Date.now() + resData.expires_in * 1000);

    return await creds.save(this.crud.session);
  }

  async uninstall(user: UserBase): Promise<boolean> {
    const creds = await this.crud.get_installation_by_user_id(
      user.id,
      SIDInstaller.PROVIDER
    );

    if (!creds) {
      return false;
    }

    const deleteToken = encryption_service.decrypt(creds.refresh_token_enc);
    await this.crud.session.delete(creds);

    await axios.post('https://auth.sid.ai/oauth/revoke', {
      client_id: this.settings.sid_client_id,
      client_secret: this.settings.sid_client_secret,
      token: deleteToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return true;
  }
}

const integrations: Record<string, new (crud: OAuthCrud, settings: Settings) => OAuthInstaller> = {
  [SIDInstaller.PROVIDER]: SIDInstaller,
};

export function installerFactory(
  provider: string,
  crud: OAuthCrud,
  settings: Settings
): OAuthInstaller {
  const InstallerClass = integrations[provider];
  if (!InstallerClass) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  return new InstallerClass(crud, settings);
}
