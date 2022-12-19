/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { RoutesIgnored, RoutesMap } from '@aws/workbench-core-authorization';
import { resourceTypeToKey, uuidRegExpAsString, envTypeIdRegExpString } from '@aws/workbench-core-base';

export const routesMap: RoutesMap = {
  '/awsAccounts': {
    POST: [
      {
        action: 'CREATE',
        subject: 'Account'
      }
    ],
    GET: [
      {
        action: 'READ',
        subject: 'Account'
      }
    ]
  },
  '/awsAccountTemplateUrls': {
    POST: [
      {
        action: 'CREATE',
        subject: 'AccountTemplate'
      }
    ]
  },
  [`/awsAccounts/${resourceTypeToKey.account.toLowerCase()}-${uuidRegExpAsString}`]: {
    GET: [
      {
        action: 'READ',
        subject: 'Account'
      }
    ],
    PATCH: [
      {
        action: 'UPDATE',
        subject: 'Account'
      }
    ]
  },
  '/costCenters': {
    POST: [
      {
        action: 'CREATE',
        subject: 'CostCenter'
      }
    ],
    GET: [
      {
        action: 'READ',
        subject: 'CostCenter'
      }
    ]
  },
  [`/costCenters/${resourceTypeToKey.costCenter.toLowerCase()}-${uuidRegExpAsString}`]: {
    GET: [
      {
        action: 'READ',
        subject: 'CostCenter'
      }
    ],
    PATCH: [
      {
        action: 'UPDATE',
        subject: 'CostCenter'
      }
    ]
  },
  [`/costCenters/${resourceTypeToKey.costCenter.toLowerCase()}-${uuidRegExpAsString}/softDelete`]: {
    PUT: [
      {
        action: 'UPDATE',
        subject: 'CostCenter'
      }
    ]
  },
  '/datasets': {
    GET: [
      {
        action: 'READ',
        subject: 'Dataset'
      }
    ],
    POST: [
      {
        action: 'CREATE',
        subject: 'Dataset'
      }
    ]
  },
  [`/datasets/${resourceTypeToKey.dataset.toLowerCase()}-${uuidRegExpAsString}`]: {
    GET: [
      {
        action: 'READ',
        subject: 'Dataset'
      }
    ]
  },
  '/datasets/import': {
    POST: [
      {
        action: 'CREATE',
        subject: 'Dataset'
      }
    ]
  },
  '/datasets/share': {
    POST: [
      {
        action: 'CREATE',
        subject: 'Dataset'
      }
    ]
  },
  '/environments': {
    GET: [
      {
        action: 'READ',
        subject: 'Environment'
      }
    ],
    POST: [
      {
        action: 'CREATE',
        subject: 'Environment'
      }
    ]
  },
  [`/environments/${resourceTypeToKey.environment.toLowerCase()}-${uuidRegExpAsString}`]: {
    GET: [
      {
        action: 'READ',
        subject: 'Environment'
      }
    ]
  },
  [`/environments/${resourceTypeToKey.environment.toLowerCase()}-${uuidRegExpAsString}/connections`]: {
    GET: [
      {
        action: 'READ',
        subject: 'EnvironmentConnection'
      }
    ]
  },
  [`/environments/${resourceTypeToKey.environment.toLowerCase()}-${uuidRegExpAsString}/start`]: {
    PUT: [
      {
        action: 'UPDATE',
        subject: 'Environment'
      }
    ]
  },
  [`/environments/${resourceTypeToKey.environment.toLowerCase()}-${uuidRegExpAsString}/stop`]: {
    PUT: [
      {
        action: 'UPDATE',
        subject: 'Environment'
      }
    ]
  },
  [`/environments/${resourceTypeToKey.environment.toLowerCase()}-${uuidRegExpAsString}/terminate`]: {
    PUT: [
      {
        action: 'UPDATE',
        subject: 'Environment'
      }
    ]
  },
  '/environmentTypes': {
    GET: [
      {
        action: 'READ',
        subject: 'EnvironmentType'
      }
    ]
  },
  [`/environmentTypes/${envTypeIdRegExpString}`]: {
    GET: [
      {
        action: 'READ',
        subject: 'EnvironmentType'
      }
    ],
    PATCH: [
      {
        action: 'UPDATE',
        subject: 'EnvironmentType'
      }
    ]
  },
  [`/environmentTypes/${envTypeIdRegExpString}/configurations`]: {
    GET: [
      {
        action: 'READ',
        subject: 'EnvironmentTypeConfig'
      }
    ],
    POST: [
      {
        action: 'CREATE',
        subject: 'EnvironmentTypeConfig'
      }
    ]
  },
  [`/environmentTypes/${envTypeIdRegExpString}/configurations/${resourceTypeToKey.envTypeConfig.toLowerCase()}-${uuidRegExpAsString}`]:
    {
      GET: [
        {
          action: 'READ',
          subject: 'EnvironmentTypeConfig'
        }
      ],
      PATCH: [
        {
          action: 'UPDATE',
          subject: 'EnvironmentTypeConfig'
        }
      ],
      DELETE: [
        {
          action: 'DELETE',
          subject: 'EnvironmentTypeConfig'
        }
      ]
    },
  '/projects': {
    GET: [
      {
        action: 'READ',
        subject: 'Project'
      }
    ]
  },
  '/roles': {
    POST: [
      {
        action: 'CREATE',
        subject: 'Role'
      }
    ]
  },
  '/users': {
    GET: [
      {
        action: 'READ',
        subject: 'User'
      }
    ],
    POST: [
      {
        action: 'CREATE',
        subject: 'User'
      }
    ]
  },
  [`/users/${uuidRegExpAsString}`]: {
    DELETE: [
      {
        action: 'DELETE',
        subject: 'User'
      }
    ],
    PATCH: [
      {
        action: 'UPDATE',
        subject: 'User'
      }
    ],
    GET: [
      {
        action: 'READ',
        subject: 'User'
      }
    ]
  },
  '/roles/Researcher': {
    PUT: [
      {
        action: 'UPDATE',
        subject: 'Role'
      }
    ]
  }
};

export const routesIgnored: RoutesIgnored = {
  '/login': {
    GET: true
  },
  '/token': {
    POST: true
  },
  '/logout': {
    POST: true
  },
  '/refresh': {
    GET: true
  },
  '/loggedIn': {
    GET: true
  }
};
