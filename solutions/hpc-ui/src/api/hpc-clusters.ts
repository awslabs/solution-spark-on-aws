import useSWR from 'swr';
import { httpApiGet, httpApiPost, httpApiPut } from './apiHelper';
import { Cluster, Job, JobParameters } from '../models/HPC-UI-Types';

const getClusters = async (projectId: string): Promise<Cluster[]> => {
  return await httpApiGet(`projects/${projectId}/clusters`, {});
};

const useCluster = (projectId: string, clusterName: string) => {
  const { data: cluster } = useSWR(
    clusterName !== undefined ? `projects/${projectId}/clusters/${clusterName}` : null,
    httpApiGet,
    {
      refreshInterval: 15000
    }
  );
  return cluster as Cluster;
};

const useJobQueue = (projectId: string, clusterName: string, instanceId: string) => {
  const { data, mutate: jobMutate } = useSWR(
    instanceId !== undefined
      ? `projects/${projectId}/clusters/${clusterName}/headNode/${instanceId}/jobs`
      : null,
    httpApiGet,
    { refreshInterval: 5000 }
  );
  let jobs = ((data && data.StandardOutputContent) || []) as unknown as Job[];
  return { jobs, jobMutate };
};

const stopJob = async (
  projectId: string,
  clusterName: string,
  instanceId: string,
  jobId: number
): Promise<void> => {
  await httpApiPut(
    `projects/${projectId}/clusters/${clusterName}/headNode/${instanceId}/jobs/${jobId}/cancel`,
    {}
  );
};

const submitJob = async (
  projectId: string,
  clusterName: string,
  instanceId: string,
  jobBody: JobParameters
): Promise<void> => {
  await httpApiPost(`projects/${projectId}/clusters/${clusterName}/headNode/${instanceId}/jobs/`, jobBody);
};

export { getClusters, useCluster, useJobQueue, stopJob, submitJob };
