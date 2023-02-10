/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';

// eslint-disable-next-line @rushstack/typedef-var
export const CreateKeyPairRequestParser = z
  .object({
    projectId: z.string()
  })
  .strict();

export type CreateKeyPairRequest = z.infer<typeof CreateKeyPairRequestParser>;