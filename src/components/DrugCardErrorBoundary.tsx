'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class DrugCardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[Pill Trace] DrugCard render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <article className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-center min-h-[120px]">
          <p className="text-sm text-gray-400">카드를 표시할 수 없습니다.</p>
        </article>
      );
    }
    return this.props.children;
  }
}
