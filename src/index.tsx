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

const store = createStore(rootReducer);

// 初始化主题色 CSS 变量
function initThemeColor() {
  const themeColor = defaultSettings.themeColor;
  const theme =
    document.querySelector('body')?.getAttribute('arco-theme') || 'light';
  const list = generate(themeColor, {
    list: true,
    dark: theme === 'dark',
  });
  list.forEach((l, index) => {
    const rgbStr = getRgbStr(l);
    document.body.style.setProperty(`--arcoblue-${index + 1}`, rgbStr);
  });
}

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
    // 初始化主题色
    initThemeColor();

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
