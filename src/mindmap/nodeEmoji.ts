const groups = [
  { name: '任务状态', items: [
    ['✅','完成'], ['⏳','等待'], ['🚧','进行中'], ['⛔','阻塞'], ['📅','排期'], ['🔁','重复'],
    ['🎯','目标'], ['🚀','启动'], ['🏁','里程碑'], ['🔔','提醒'], ['📌','置顶'], ['🔥','紧急'],
  ] },
  { name: '想法与标记', items: [
    ['💡','灵感'], ['⭐','重点'], ['❓','疑问'], ['⚠️','注意'], ['🔍','研究'], ['🧩','方案'],
    ['📚','资料'], ['📊','数据'], ['🛠️','工具'], ['🤝','协作'], ['🌱','成长'], ['🏆','成果'],
  ] },
  { name: '学习与知识', items: [
    ['📖','阅读'], ['📝','笔记'], ['🧠','记忆'], ['🎓','课程'], ['🧪','实验'], ['✏️','练习'],
    ['📐','设计'], ['🗣️','表达'], ['🏫','课堂'], ['🔬','分析'], ['🗒️','复习'], ['🔖','书签'],
  ] },
  { name: '项目与日程', items: [
    ['🗓️','日历'], ['🕒','截止'], ['👥','会议'], ['📋','清单'], ['📎','附件'], ['🗂️','归档'],
    ['📦','交付'], ['✉️','邮件'], ['💬','反馈'], ['🐞','缺陷'], ['💰','预算'], ['🧭','规划'],
  ] },
  { name: '表情反应', items: [
    ['😀','开心'], ['🥰','喜爱'], ['🤔','思考'], ['😮','惊讶'], ['😅','汗颜'], ['😎','自信'],
    ['🥳','庆祝'], ['😴','休息'], ['👍','赞同'], ['👏','鼓掌'], ['💪','加油'], ['❤️','喜欢'],
  ] },
]

export const emojiGroups = groups.map(group => ({
  name: group.name,
  items: group.items.map(([glyph,label]) => ({
    glyph, label, id: 'emoji_' + Array.from(glyph, ch => ch.codePointAt(0)!.toString(16)).join('-'),
  })),
}))

export const emojiIconList = [{
  type: 'emoji', name: 'Emoji',
  list: emojiGroups.flatMap(group => group.items.map(({ glyph,id }) => ({
    name: id.slice(6),
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text x="16" y="26" text-anchor="middle" font-size="27" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${glyph}</text></svg>`,
  }))),
}]
