/**
 * Measures and reports web performance metrics.
 * 
 * Purpose:
 *  - Collects key performance indicators (KPIs) like CLS, FID, FCP, LCP, and TTFB.
 *  - Sends the results to a provided callback function (e.g., for analytics or logging).
 * 
 * Expected Inputs:
 *  - onPerfEntry (function, optional): A callback function that receives performance metric entries.
 * 
 * Expected Outputs:
 *  - Calls `onPerfEntry` with each performance metric.
 * 
 * Side Effects:
 *  - Dynamically imports the 'web-vitals' library.
 *  - Executes the callbacks asynchronously.
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
