# 路演正式素材替换区

当前路演模式使用本地演示图片和专业分析图占位，核心流程完全离线运行。

正式素材到位后：

1. 将可编辑 PPTX 放在本目录，建议文件名：
   `松林社区公园景观方案汇报.pptx`
2. 在 `src/data/roadshowProject.js` 的 `deliverables.editablePpt.fileUrl` 中填写：
   `./roadshow-assets/松林社区公园景观方案汇报.pptx`
3. 将功能分区、慢行动线和空间结构分析图放入本目录，并在同一数据文件中替换对应的 `analysisDiagrams[].image`。

不要将 PDF 或静态图片标记为“可编辑 PPT”。
