import { isPluginConfigurationError } from '@aws/workbench-core-authentication';
import {
  DynamicAuthorizationService,
  isGroupAlreadyExistsError,
  isTooManyRequestsError
} from '@aws/workbench-core-authorization';
import {
  CreateGroupRequest,
  CreateGroupRequestParser
} from '@aws/workbench-core-authorization/lib/models/createGroup';
import { validateAndParse } from '@aws/workbench-core-base';
import * as Boom from '@hapi/boom';
import { Router, Request, Response } from 'express';
import { dynamicAuthorizationService } from '../services/dynamicAuthorizationService';
import { wrapAsync } from '../utilities/errorHandlers';

export function setUpDynamicAuthorizationRoutes(router: Router, service: DynamicAuthorizationService): void {
  router.post(
    '/authorization/group',
    wrapAsync(async (req: Request, res: Response) => {
      try {
        const validatedRequest = validateAndParse<CreateGroupRequest>(CreateGroupRequestParser, req.body);

        const { data } = await dynamicAuthorizationService.createGroup({
          authenticatedUser: res.locals.user,
          ...validatedRequest
        });
        res.status(201).send(data);
      } catch (error) {
        if (isGroupAlreadyExistsError(error)) {
          throw Boom.badRequest('Group already exists');
        }
        if (isPluginConfigurationError(error)) {
          throw Boom.internal('An internal error occurred');
        }
        if (isTooManyRequestsError(error)) {
          throw Boom.tooManyRequests('Too many requests');
        }
        throw error;
      }
    })
  );
}
