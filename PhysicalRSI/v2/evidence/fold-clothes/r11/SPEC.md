# R11 本体反馈运输与恒姿态清空工作区（待执行冻结）

证据：R10 base seed1 18–23自然终局[0,0,0,100,0,100]；seed0 8–13[0,0,20,0,20,0]，base12均20。base_s1/pose_diagnostics.json和rgb_diagnostics.jpg记录6布局：左fold末平面误差32–103mm，lower能下降；env0/4左臂在retreat_home旋转后持续偏离home，衣摆close误差>400/200mm。RGB190/380相应衣物未折齐且机械臂异常停驻。不能凭这些观测确认碰撞对或布料接触力。

直接RGB CAP路线，保留SAM轮廓模板/光流、袖10mm内移与35%送布、固定抓取姿态、R10落点反馈。新的共同机制为本体闭环Cartesian路径：fold每步从实际EE出发，限制平面前进12mm；以跟随误差停滞检测触发原地10mm下降，让折入路径在官方IK能到达的高度继续推进，最低距布面25mm。正常跟随时向65mm运输高度推进。禁止访问环境IK/planner/GT，位置仅用官方本体。

释放后的20步先10步原地抬至65mm，再10步以固定抓取姿态退向该臂初始XY和65mm高度，取消近衣物区域旋转回home导致的姿态跳变。下一阶段从实际本体起点插值，不从尚未到达的上一条命令续接。时序仍袖190×2，衣摆110，500步官方自然终局，失败合法hold。该revision同时改变运输反馈与清空方式，不能把分差归因单参数。

开发预定base12/random12各两个seed：固定回归base seed1[18..23]、random seed1[0..5]；轮换base seed0[14..19]、random seed0[12..17]。这只是新revision，不重跑R8/R10旧候选。相同回归范围基线复用原生记录。每配置至少12个实际不同内容布局，冻结前实际Geometry+Garment内容比较（去除visual字段），不按seed认定新布局。另验证每配置20个实际布局，从非本轮开发、非已分析历史中按顺序固定；曝光不能穷尽则pending，优先全未见，不能因seed不同宣称未见。现有R10验证集不用于R11选模或轨迹检查，R11不得打断R10队列。

实现和CPU闭环模拟检查后才冻结cohort与预算。源码、配置、入口、依赖路径先同步CPFS02并写policy_sync.json，然后独立tmux并行运行R11，保留R10全部进程和冻结队列。有效GPU工作不能重启、重复局不能补负载。保留R8最好成功版本；正式预期任务分仍null，开发/冻结覆盖分分列。

资源执行修订（冻结前）：实际GPU为72GB RTX PRO5000，R10显存18–21GB；cgroup内存使用约41GB/120GB、系统available约100GB、CPU quota24核。采用两个独立evaluator并行：R10完全不改，R11 policy/等待器/evaluator统一19111，独立results/r11与r11_validation，OMP4/BLAS1。共用常驻SAM108915，SAM服务已串行处理推理；不重启该模型。R11 base开发batch6；random开发num_envs3平衡两次3布局reset，共6局/seed，避免5+1尾批。验证按同seed分组每批最多5环境，不补重复局。执行状态写research_resume_r11.json及active_experiments.json，避免与R10运行器覆盖primary resume竞争。

验证预冻结选择仅用已有任务曝光清单和布局内容；避开本轮开发与R10保留验证集。base20无已知native重合但均pending；random20包含19个无已知native重合且pending、1个已知曝光。未完整历史不能确认unseen，确认未见子集n=0、均分/离散程度null，预期任务分null；不把这组覆盖自动称正式验收。具体seed/layout见cohort.json，不按结果换样。
