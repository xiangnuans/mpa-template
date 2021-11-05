/// <reference types="react-scripts" />
declare module '*.module.less' {
  const classes: any
  export default classes
}

// 使用 dayjs 替换 antd 默认使用的 moment
declare module 'moment' {
  import { Dayjs } from 'dayjs'
  namespace moment {
    type Moment = Dayjs
  }
  export = moment
  export as namespace moment
}
