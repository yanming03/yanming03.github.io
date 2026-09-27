# 原始 6300 全量评测结果

计划 6300 条；有效完成 5850 条；按任务配置排除 450 条。有效 episode 加权平均得分 38.28547 / 100，成功率 32.76923%。

每台最多两组、每组 10 环境；沿用冻结的 cap_pi05_score routing。最终独立视频审计覆盖 144 个任务/seed 单元，无视频错误。

上游合并任务表保留其原有统计规则：标准与 random 配置缺失时，部分合并任务行为空。因此上游宏平均与上述有效 episode 加权指标不同。

|任务配置|策略|有效/计划|平均得分|成功率|
|---|---|---:|---:|---:|
|align_blocks|CAP|150/150|86.6667|86.6667%|
|arrange_largest_number|PI05|75/75|5.5333|0.0000%|
|arrange_largest_number_random|CAP|75/75|37.0667|25.3333%|
|build_tower|PI05-sparse-mem|150/150|65.0667|57.3333%|
|classify_objects|CAP|150/150|57.9000|42.6667%|
|classify_objects_by_language|CAP|150/150|25.0667|10.6667%|
|cover_blocks|CAP|150/150|100.0000|100.0000%|
|deposit_coin|CAP|150/150|58.4000|51.3333%|
|fasten_screws|PI05-sparse-mem|150/150|23.2667|2.0000%|
|fill_egg_holder|PI05|150/150|2.3000|0.0000%|
|fill_pen_holder|PI05-sparse-mem|150/150|22.0667|6.0000%|
|fold_clothes|PI05|75/75|46.4000|38.6667%|
|fold_clothes_random|PI05|0/75|排除|排除|
|general_pickup|CAP|150/150|44.0000|44.0000%|
|hang_mugs|PI05|75/75|8.0667|0.0000%|
|hang_mugs_random|PI05|75/75|2.8000|0.0000%|
|imitate_sorting_sequence|PI05|150/150|1.0000|0.0000%|
|insert_key|CAP|150/150|49.5667|40.6667%|
|insert_tubes|CAP|150/150|77.8667|65.3333%|
|make_kong|CAP|150/150|85.3333|85.3333%|
|make_toast|PI05-sparse-mem|75/75|10.6667|2.6667%|
|make_toast_random|PI05-sparse-mem|0/75|排除|排除|
|match_and_pick_from_conveyor|PI05-sparse-mem|150/150|16.6667|16.6667%|
|organize_table|PI05-sparse-mem|150/150|26.8333|0.6667%|
|pack_objects_into_box|PI05|75/75|29.6000|6.6667%|
|pack_objects_into_box_random|PI05|75/75|14.4667|1.3333%|
|pick_from_conveyor_by_image|PI05|150/150|0.0000|0.0000%|
|play_Xylophone|PI05|150/150|0.0000|0.0000%|
|play_stacking_toy|PI05|150/150|0.0000|0.0000%|
|play_tic_tac_toe|CAP|150/150|97.5667|92.6667%|
|plug_in_charger|CAP|150/150|32.0000|32.0000%|
|pour_balls_into_vase|CAP|150/150|39.3333|39.3333%|
|pour_by_language|CAP|150/150|9.7333|0.0000%|
|pour_liquid_into_cup|CAP|75/75|89.3333|89.3333%|
|pour_liquid_into_cup_random|PI05-sparse-mem|0/75|排除|排除|
|press_by_number|CAP|150/150|85.3333|85.3333%|
|push_T|CAP|75/75|65.3333|65.3333%|
|push_T_random|PI05|75/75|0.0000|0.0000%|
|put_bottles_into_dustbin|PI05-sparse-mem|150/150|81.1000|70.0000%|
|solve_equation|CAP|150/150|61.3333|61.3333%|
|sort_nesting_dolls_by_size|CAP|75/75|25.3333|25.3333%|
|sort_nesting_dolls_by_size_random|PI05|75/75|0.0000|0.0000%|
|stack_blocks|PI05-sparse-mem|75/75|29.6667|22.6667%|
|stack_blocks_by_language|CAP|150/150|0.0000|0.0000%|
|stack_blocks_random|PI05-sparse-mem|0/75|排除|排除|
|stack_bowls|PI05-sparse-mem|75/75|70.4667|66.6667%|
|stack_bowls_random|PI05-sparse-mem|75/75|15.7333|5.3333%|
|store_laptop_and_headphones|PI05|0/75|排除|排除|
|store_laptop_and_headphones_random|PI05|0/75|排除|排除|
|store_tools_in_toolbox|CAP|150/150|6.1667|0.0000%|
|swap_T|CAP|150/150|93.3333|93.3333%|
|swap_blocks|PI05-sparse-mem|150/150|19.3333|19.3333%|
|sweep_blocks|PI05|75/75|1.3333|1.3333%|
|sweep_blocks_random|PI05|75/75|0.0000|0.0000%|

跳过证据：`runtime/fleets/official6300_24gpu_groups10_max20_agent_20260922/skipped_tasks/`。
新 unseen150 实验仍在进行，此报告仅涵盖原始实验。
