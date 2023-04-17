/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

// eslint-disable-next-line @rushstack/typedef-var
export const StopEnvironmentRequestParser = z.object({
  projectId: z.string().min(1),
  environmentId: z.string().min(1)
});

export type StopEnvironmentRequest = z.infer<typeof StopEnvironmentRequestParser>;
