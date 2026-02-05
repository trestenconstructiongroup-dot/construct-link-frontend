declare module '*.svg' {
  const value: number | { uri: string } | { default: { uri: string } };
  export default value;
}
