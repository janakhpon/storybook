import React, { Fragment } from 'react';
import { Box, Color } from 'ink';
import Spinner from 'ink-spinner';

import { Status as TStatus } from '../../types/runner';

interface CompletedProps {
  title: string;
  message: string;
  status: TStatus;
}
interface ProgressingProps {
  title: string;
  percentage: number;
  message: string;
  extra: string;
}

const useScreenWidth = () => {
  return process.stdout.columns || 90;
};

const Progressing = ({ title, percentage, message: content, extra }: ProgressingProps) => {
  const l0 = useScreenWidth() - title.length - extra.length - 4;
  const pad = Array(l0)
    .fill(' ')
    .join('');
  const l1 = Math.ceil(l0 * (percentage / 100));
  const l2 = l0 - l1;

  const message = ` ${content} `;

  const m1 = message.concat(pad).slice(0, l1);
  const m2 = message
    .slice(l1)
    .concat(pad)
    .slice(0, l2);

  return (
    <Box>
      <Spinner type={percentage === 0 ? 'bounce' : 'dots'} /> <Color blue>{title}</Color>{' '}
      {m1 ? (
        <Color black bgHex="#1EA7FD">
          {message.concat(pad).slice(0, l1)}
        </Color>
      ) : null}
      {m2 ? (
        <Color gray bgHex="#000">
          {m2}
        </Color>
      ) : null}
      <Color gray> {extra}</Color>
    </Box>
  );
};

const Status = ({ status }: { status: TStatus }) =>
  status === 'success' ? <Color green>OK</Color> : <Color red>FAIL</Color>;

const Completed = ({ title, message, status }: CompletedProps) => {
  return (
    <Box>
      {title} <Status status={status} />
      {message ? (
        <Fragment>
          {' '}
          - <Color gray>{message}</Color>
        </Fragment>
      ) : null}
    </Box>
  );
};

export { Progressing, Completed };
