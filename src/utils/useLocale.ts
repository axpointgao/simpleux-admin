import defaultLocale from '../locale';

function useLocale(locale = null) {
  // 固定使用中文
  return (locale || defaultLocale)['zh-CN'] || {};
}

export default useLocale;
