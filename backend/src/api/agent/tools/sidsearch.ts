import { z } from 'zod';
import axios from 'axios';
import { Tool } from './tool';
import { summarizeSearchResults } from './utils';
import { OAuthCrud } from '@/db/crud/oauth';

interface SidSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  created_at: string;
}

export class SidSearchTool extends Tool {
  name = 'sid-search';
  description = 'Search through your personal data using Sid AI';
  schema = z.string().describe('The search query');

  private readonly crud: OAuthCrud;
  private readonly userId: string;

  constructor(
    crud: OAuthCrud,
    userId: string
  ) {
    super();
    this.crud = crud;
    this.userId = userId;
  }

  protected async _call(query: string): Promise<string> {
    try {
      const creds = await this.crud.get_installation_by_user_id(
        this.userId,
        'sid'
      );

      if (!creds?.access_token_enc) {
        return 'Sid AI is not connected. Please connect your account first.';
      }

      const results = await this.sidSearch(query, creds.access_token_enc);
      if (!results.length) {
        return 'No results found in your personal data.';
      }

      return await summarizeSearchResults(
        results.map(r => ({
          title: r.title,
          link: r.url,
          snippet: r.snippet,
        })),
        query,
        this.context.model_settings.language
      );
    } catch (error) {
      console.error('Sid search error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return 'Your Sid AI connection needs to be refreshed. Please reconnect your account.';
      }
      return 'Error performing search in your personal data.';
    }
  }

  private async sidSearch(
    query: string,
    accessToken: string
  ): Promise<SidSearchResult[]> {
    try {
      const response = await axios.post(
        'https://api.sid.ai/v1/users/me/query',
        {
          query: query,
          max_results: 4,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.results;
    } catch (error) {
      console.error('Sid API error:', error);
      throw error;
    }
  }

  private async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://auth.sid.ai/oauth/token',
        {
          grant_type: 'refresh_token',
          client_id: process.env.SID_CLIENT_ID,
          client_secret: process.env.SID_CLIENT_SECRET,
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
}
