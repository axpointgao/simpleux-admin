import './style/global.less';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { ConfigProvider } from '@arco-design/web-react';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import axios from 'axios';
import { generate, getRgbStr } from '@arco-design/color';
import rootReducer from './store';
import PageLayout from './layout';
import { GlobalContext } from './context';
import Login from './pages/login';
import checkLogin from './utils/checkLogin';
import changeTheme from './utils/changeTheme';
import useStorage from './utils/useStorage';
import defaultSettings from './settings.json';
import './mock';

// 抑制 ResizeObserver 循环警告（这是浏览器已知问题，不影响功能）
const originalError = window.onerror;
const originalConsoleError = console.error;

// 重写 window.onerror
window.onerror = (message, source, lineno, colno, error) => {
  const messageStr = String(message || '');
  if (
    messageStr.includes('ResizeObserver loop') ||
    messageStr.includes('ResizeObserver loop limit exceeded') ||
    messageStr.includes(
      'ResizeObserver loop completed with undelivered notifications'
    )
  ) {
    return true; // 抑制此错误
  }
  if (originalError) {
    return originalError(message, source, lineno, colno, error);
  }
  return false;
};

// 重写 console.error 以捕获 ResizeObserver 错误
console.error = (...args) => {
  const errorMessage = args.join(' ');
  if (
    errorMessage.includes('ResizeObserver loop') ||
    errorMessage.includes('ResizeObserver loop limit exceeded') ||
    errorMessage.includes(
      'ResizeObserver loop completed with undelivered notifications'
    )
  ) {
    return; // 不输出 ResizeObserver 相关错误
  }
  originalConsoleError.apply(console, args);
};

// 捕获未处理的错误事件
window.addEventListener(
  'error',
  (e) => {
    const errorMessage = e.message || String(e.error || '');
    if (
      errorMessage.includes('ResizeObserver loop') ||
      errorMessage.includes('ResizeObserver loop limit exceeded') ||
      errorMessage.includes(
        'ResizeObserver loop completed with undelivered notifications'
      )
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  },
  true
); // 使用捕获阶段

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (e) => {
  const errorMessage = e.reason?.message || String(e.reason || '');
  if (
    errorMessage.includes('ResizeObserver loop') ||
    errorMessage.includes('ResizeObserver loop limit exceeded') ||
    errorMessage.includes(
      'ResizeObserver loop completed with undelivered notifications'
    )
  ) {
    e.preventDefault();
    return false;
  }
});

const store = createStore(rootReducer);

// 初始化主题色 CSS 变量
function initThemeColor() {
  const theme =
    document.querySelector('body')?.getAttribute('arco-theme') || 'light';
  const themeColor = defaultSettings.themeColor || '#0baf2d';
  const list = generate(themeColor, {
    list: true,
    dark: theme === 'dark',
  });
  list.forEach((l, index) => {
    const rgbStr = getRgbStr(l);
    document.body.style.setProperty(`--arcoblue-${index + 1}`, rgbStr);
  });
}

// 在应用启动时初始化主题色
initThemeColor();

function Index() {
  const [theme, setTheme] = useStorage('arco-theme', 'light');

  function getArcoLocale() {
    // 固定使用中文
    return zhCN;
  }

  function fetchUserInfo() {
    store.dispatch({
      type: 'update-userInfo',
      payload: { userLoading: true },
    });
    axios.get('/api/user/userInfo').then((res) => {
      store.dispatch({
        type: 'update-userInfo',
        payload: { userInfo: res.data, userLoading: false },
      });
    });
  }

  useEffect(() => {
    if (checkLogin()) {
      fetchUserInfo();
    } else if (window.location.pathname.replace(/\//g, '') !== 'login') {
      window.location.pathname = '/login';
    }
  }, []);

  useEffect(() => {
    changeTheme(theme);
  }, [theme]);

  const contextValue = {
    theme,
    setTheme,
  };

  return (
    <BrowserRouter>
      <ConfigProvider
        locale={getArcoLocale()}
        componentConfig={{
          Card: {
            bordered: false,
          },
          List: {
            bordered: false,
          },
          Table: {
            border: false,
          },
        }}
      >
        <Provider store={store}>
          <GlobalContext.Provider value={contextValue}>
            <Switch>
              <Route path="/login" component={Login} />
              <Route path="/" component={PageLayout} />
            </Switch>
          </GlobalContext.Provider>
        </Provider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

ReactDOM.render(<Index />, document.getElementById('root'));
