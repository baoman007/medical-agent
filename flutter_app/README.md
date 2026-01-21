# 医疗问诊助手 Flutter 应用

## 功能特性

- 智能医疗问诊
- 常见症状快速选择
- 问诊历史记录管理
- 紧急程度智能评估
- 美观的 Material Design 界面

## 项目结构

```
lib/
├── main.dart                 # 应用入口
├── models/
│   └── medical_consultation.dart  # 数据模型
├── screens/
│   ├── home_screen.dart      # 主页面（问诊）
│   └── history_screen.dart   # 历史记录页面
└── services/
    ├── api_service.dart      # API 服务
    └── storage_service.dart  # 本地存储服务
```

## 配置 API 地址

如果需要在真实设备或局域网访问，修改 `lib/services/api_service.dart`：

```dart
final ApiService _apiService = ApiService(
  baseUrl: 'http://192.168.2.207:3001', // 修改为你的局域网 IP
  timeout: const Duration(seconds: 60),
);
```

## 运行方式

### 1. 启动后端服务
```bash
cd /Users/baozhen/CodeBuddy/medical-agent
npm run serve
```

### 2. 运行 Flutter 应用

#### iOS 模拟器（仅 Mac）
```bash
cd /Users/baozhen/CodeBuddy/medical-agent/flutter_app
flutter run
```

#### Android 模拟器
```bash
cd /Users/baozhen/CodeBuddy/medical-agent/flutter_app
flutter run -d android
```

#### 连接真机
```bash
# 开启 USB 调试后
cd /Users/baozhen/CodeBuddy/medical-agent/flutter_app
flutter devices
flutter run -d <设备ID>
```

#### Web 版本
```bash
cd /Users/baozhen/CodeBuddy/medical-agent/flutter_app
flutter run -d chrome
```

## 网络权限配置（Android）

真实设备访问需要网络权限，已自动配置在 `android/app/src/main/AndroidManifest.xml`。

## 功能说明

### 主页面
- 输入症状描述
- 快速选择常见症状
- 提交问诊请求
- 显示问诊结果和建议

### 历史记录页面
- 查看所有问诊记录
- 查看详细问诊信息
- 删除单条记录
- 清空所有记录

## 依赖包

- `http`: HTTP 网络请求
- `shared_preferences`: 本地数据持久化
- `intl`: 国际化和日期格式化

## 注意事项

1. 确保后端服务正常运行
2. 确保手机和电脑在同一网络（真机访问）
3. API 地址需根据实际情况配置
4. 建议使用 DeepSeek API（在 .env 中配置）
