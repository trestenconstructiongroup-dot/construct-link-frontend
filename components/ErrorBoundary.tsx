import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.details}>{this.state.error.message}</Text>
          )}
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    ...Platform.select({
      web: { minHeight: '100vh' as any },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e293b',
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  details: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 400,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
});
