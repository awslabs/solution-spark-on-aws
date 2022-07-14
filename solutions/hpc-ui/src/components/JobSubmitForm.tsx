import { useState } from 'react';
import { submitJob } from '../api/hpc-clusters';
import { JobParameters } from '../models/HPC-UI-Types';
import { Box, Button, FormField, Input, Modal, SpaceBetween } from '@awsui/components-react';

interface JobSubmitFormProps {
  projectId: string;
  clusterName: string;
  instanceId: string;
  handleViewJobFormCallBack: () => void;
}

export default function JobSubmitForm(props: JobSubmitFormProps): JSX.Element {
  const [jobForm, setJobForm] = useState({
    command: '',
    job_name: '',
    nodes: 0,
    ntasks: 0,
    partition: ''
  } as JobParameters);

  const shouldDisableSubmitButton = (): boolean => {
    return !(
      jobForm.command !== '' &&
      jobForm.job_name !== '' &&
      jobForm.nodes !== 0 &&
      jobForm.ntasks !== 0 &&
      jobForm.partition !== ''
    );
  };

  const executeSubmitJobProcess = (): void => {
    submitJob(props.projectId, props.clusterName, props.instanceId, jobForm);
    props.handleViewJobFormCallBack();
  };

  return (
    <Modal
      onDismiss={() => props.handleViewJobFormCallBack()}
      visible
      closeAriaLabel="Close modal"
      size="medium"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => props.handleViewJobFormCallBack()}>Cancel</Button>
            <Button disabled={shouldDisableSubmitButton()} onClick={() => executeSubmitJobProcess()}>
              Submit
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Submit Job"
    >
      <SpaceBetween direction="vertical" size="l">
        <FormField label="Job Name" description="Please choose an identifier for this job.">
          <Input
            onChange={({ detail }) => setJobForm({ ...jobForm, job_name: detail.value })}
            value={jobForm.job_name}
            placeholder="job-name"
          />
        </FormField>
        <FormField label="Nodes" description="Number of nodes for job.">
          <Input
            onChange={({ detail }) => setJobForm({ ...jobForm, nodes: parseInt(detail.value, 10) || 0 })}
            value={jobForm.nodes.toString()}
            inputMode="numeric"
            placeholder="0"
          />
        </FormField>
        <FormField label="Number of Tasks" description="Number of tasks for job.">
          <Input
            onChange={({ detail }) => setJobForm({ ...jobForm, ntasks: parseInt(detail.value, 10) || 0 })}
            value={jobForm.ntasks.toString()}
            inputMode="numeric"
            placeholder="0"
          />
        </FormField>
        <FormField label="Queue" description="Queue where the job will run.">
          <Input
            onChange={({ detail }) => setJobForm({ ...jobForm, partition: detail.value })}
            value={jobForm.partition}
            placeholder="queue0"
          />
        </FormField>
        <FormField label="Script Path" description="Path to the script to run.">
          <Input
            onChange={({ detail }) => setJobForm({ ...jobForm, command: detail.value })}
            value={jobForm.command}
            placeholder={'/home/ec2-user/myscript.sh'}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
