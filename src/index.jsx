import { createRoot } from 'react-dom/client';

import 'assets/style.css';
import 'simplebar-react/dist/simplebar.min.css';
import 'assets/third-party/apex-chart.css';
import 'assets/third-party/react-table.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

import App from './App';
import { ConfigProvider } from 'contexts/ConfigContext';
import { AuthProvider } from 'contexts/AuthContext';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const container = document.getElementById('root');
const root = createRoot(container);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => error?.response?.status !== 401 && failureCount < 3
    }
  }
});

root.render(
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

reportWebVitals();
