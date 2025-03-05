import { Router, Request, Response, NextFunction } from 'express';
import { OrganizationCrud, OrganizationUsers } from '@/db/crud/organization';
import { OAuthCrud } from '@/db/crud/oauth';
import { UserBase } from '../../../schemas';
import { OAuthInstaller, installerFactory } from '@/services/oauth_installers';
import { settings } from '@/settings';
import { getCurrentUser } from '../dependencies';
import { HTTPException } from '../errors';

const router = Router();

// Middleware to inject dependencies
const injectDependencies = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.organizationCrud = new OrganizationCrud();
  req.oauthCrud = new OAuthCrud();
  next();
};

// Custom request type with injected dependencies
interface CustomRequest extends Request {
  organizationCrud?: OrganizationCrud;
  oauthCrud?: OAuthCrud;
  user?: UserBase;
}

// Get organization by name
router.get('/organization/:name', injectDependencies, async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const org = await req.organizationCrud?.getByName(req.params.name);
    if (org) {
      return res.json(org);
    }
    throw new HTTPException(404, 'Organization not found');
  } catch (error) {
    if (error instanceof HTTPException) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth installation
router.get('/:provider', getCurrentUser, async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const redirect = req.query.redirect as string || settings.frontendUrl;
    const installer = installerFactory(req.params.provider, req.oauthCrud!);

    if (!req.user) {
      throw new HTTPException(401, 'Unauthorized');
    }

    const installUrl = await installer.install(req.user, redirect);
    res.json(installUrl);
  } catch (error) {
    if (error instanceof HTTPException) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth uninstallation
router.get('/:provider/uninstall', getCurrentUser, async (
  req: CustomRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      throw new HTTPException(401, 'Unauthorized');
    }

    const installer = installerFactory(req.params.provider, req.oauthCrud!);
    const success = await installer.uninstall(req.user);
    res.json({ success });
  } catch (error) {
    if (error instanceof HTTPException) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth callback
router.get('/:provider/callback', async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { code, state } = req.query;

    // If code or state are missing (user cancelled), redirect to frontend
    if (!code || !state) {
      return res.redirect(settings.frontendUrl);
    }

    const installer = installerFactory(req.params.provider, req.oauthCrud!);
    const creds = await installer.installCallback(code as string, state as string);
    res.redirect(creds.redirectUri);
  } catch (error) {
    if (error instanceof HTTPException) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// SID info
router.get('/sid/info', getCurrentUser, async (
  req: CustomRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      throw new HTTPException(401, 'Unauthorized');
    }

    const creds = await req.oauthCrud?.getInstallationByUserId(req.user.id, 'sid');
    res.json({
      connected: Boolean(creds?.accessTokenEnc),
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
