// 可以给fiber添加一个副作用标识符，表示此fiber的DOM节点需要做何种操作
export const NoFlags = 0b000000000000000000; // 没有动作
export const Placement = 0b000000000000000010; // 添加
export const Update = 0b000000000000000100; // 更新
export const PlacementAndUpdate = 0b000000000000000110; // 添加并更新
export const Deletion = 0b000000000000001000; // 删除
