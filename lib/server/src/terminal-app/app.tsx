import React, { Component, Fragment } from 'react';
import { Static, render, Box, Text, Color } from 'ink';
import EventEmitter from 'eventemitter3';

import { ProgressDescription, State, Status, Runner } from '../types/runner';

import { Banner } from './banner/banner';
import { Progressing, Completed } from './progress/progress';

interface Props {
  activities: {
    [name: string]: Runner;
  };
}

const reporter = (key: string, status: Status, ctx: Component<Props, Partial<State>>) => (
  data: ProgressDescription
) => {
  ctx.setState({
    [key]: {
      ...data,
      status,
    },
  });
};

class App extends Component<Props, Partial<State>> {
  constructor(props: Props) {
    super(props);

    Object.entries(props.activities).forEach(([key, { start, listen }]) => {
      start();

      ['progress', 'success', 'failure'].forEach((type: Status) => {
        listen(type, reporter(key, type, this));
      });
    });

    this.state = Object.keys(props.activities).reduce((acc, k) => {
      return { ...acc, [k]: { message: 'starting', progress: 0, status: 'progress' } };
    }, {});
  }

  render() {
    const activities = Object.entries(this.state);
    const completed = activities.filter(([, v]) => v.status !== 'progress');
    const progress = activities.filter(([, v]) => v.status === 'progress');

    return (
      <Fragment>
        <Static>
          <Box marginBottom={1} key="header">
            <Banner />
          </Box>
          {completed.length ? (
            <Box key="heading">
              <Color blue>Completed</Color>
            </Box>
          ) : null}
          {completed.map(([k, v]) => {
            return <Completed key={k} title={k} {...v} />;
          })}
        </Static>
        <Box marginBottom={1} />
        <Box flexDirection="column">
          {progress.length ? (
            <Box>
              <Color blue>In progress</Color>
            </Box>
          ) : null}
          {progress.map(([k, v]) => {
            return (
              <Progressing
                key={k}
                title={k}
                message={v.message}
                percentage={v.progress}
                extra={`${v.progress.toString()}%`}
              />
            );
          })}
        </Box>
      </Fragment>
    );
  }
}

export const run = (activities: Props['activities']) => {
  render(<App activities={activities} />);
};
