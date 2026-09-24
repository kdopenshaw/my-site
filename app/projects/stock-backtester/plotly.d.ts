declare module "plotly.js-basic-dist-min" {
  const Plotly: {
    react: (element: HTMLElement, data: object[], layout: object, config: object) => Promise<void>;
    purge: (element: HTMLElement) => void;
    Plots: { resize: (element: HTMLElement) => Promise<void> };
  };
  export default Plotly;
}
