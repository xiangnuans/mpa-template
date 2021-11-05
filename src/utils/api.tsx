import { get } from './request';

const host = {
  homework: 'homework/'
}

const API = {
  getScoreSetting: function (summaryId: number) {
    const url = `${host['homework']}common/scoreSetting/list.htm`
    return get(url, { summaryId }).then(res => res.data)
  },
}

export default API