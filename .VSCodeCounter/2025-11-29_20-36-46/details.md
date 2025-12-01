# Details

Date : 2025-11-29 20:36:46

Directory /Users/ansonjiang/Documents/Chaotic_AI

Total : 163 files,  26277 codes, 668 comments, 1316 blanks, all 28261 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [.idea/OptimizeMe.iml](/.idea/OptimizeMe.iml) | XML | 12 | 0 | 0 | 12 |
| [.idea/inspectionProfiles/Project\_Default.xml](/.idea/inspectionProfiles/Project_Default.xml) | XML | 6 | 0 | 0 | 6 |
| [.idea/modules.xml](/.idea/modules.xml) | XML | 8 | 0 | 0 | 8 |
| [.idea/prettier.xml](/.idea/prettier.xml) | XML | 6 | 0 | 0 | 6 |
| [.idea/vcs.xml](/.idea/vcs.xml) | XML | 6 | 0 | 0 | 6 |
| [adapters/node-embedded/package.json](/adapters/node-embedded/package.json) | JSON | 0 | 0 | 1 | 1 |
| [adapters/node-embedded/src/autoHook.ts](/adapters/node-embedded/src/autoHook.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [adapters/node-embedded/src/hooks/express.ts](/adapters/node-embedded/src/hooks/express.ts) | TypeScript | 70 | 7 | 20 | 97 |
| [adapters/node-embedded/src/hooks/fs.ts](/adapters/node-embedded/src/hooks/fs.ts) | TypeScript | 0 | 0 | 1 | 1 |
| [adapters/node-embedded/src/hooks/http.ts](/adapters/node-embedded/src/hooks/http.ts) | TypeScript | 25 | 0 | 9 | 34 |
| [adapters/node-embedded/src/native.ts](/adapters/node-embedded/src/native.ts) | TypeScript | 41 | 0 | 9 | 50 |
| [database/.env](/database/.env) | Properties | 1 | 0 | 0 | 1 |
| [database/package-lock.json](/database/package-lock.json) | JSON | 119 | 0 | 1 | 120 |
| [database/package.json](/database/package.json) | JSON | 18 | 0 | 1 | 19 |
| [database/prisma/migrations/20251105170650\_init/migration.sql](/database/prisma/migrations/20251105170650_init/migration.sql) | MS SQL | 89 | 23 | 30 | 142 |
| [database/prisma/schema.prisma](/database/prisma/schema.prisma) | Prisma | 114 | 9 | 24 | 147 |
| [infra/compose/docker-compose.dev.yml](/infra/compose/docker-compose.dev.yml) | YAML | 27 | 0 | 4 | 31 |
| [main/.eslintrc.json](/main/.eslintrc.json) | JSON with Comments | 3 | 0 | 1 | 4 |
| [main/CHANGELOG.md](/main/CHANGELOG.md) | Markdown | 41 | 0 | 39 | 80 |
| [main/README.md](/main/README.md) | Markdown | 22 | 0 | 15 | 37 |
| [main/components.json](/main/components.json) | JSON | 22 | 0 | 1 | 23 |
| [main/jsconfig.json](/main/jsconfig.json) | JSON with Comments | 7 | 0 | 1 | 8 |
| [main/mdx-components.jsx](/main/mdx-components.jsx) | JavaScript JSX | 7 | 0 | 2 | 9 |
| [main/next.config.mjs](/main/next.config.mjs) | JavaScript | 75 | 1 | 8 | 84 |
| [main/package-lock.json](/main/package-lock.json) | JSON | 10,249 | 0 | 1 | 10,250 |
| [main/package.json](/main/package.json) | JSON | 70 | 0 | 1 | 71 |
| [main/postcss.config.js](/main/postcss.config.js) | JavaScript | 5 | 0 | 1 | 6 |
| [main/prettier.config.js](/main/prettier.config.js) | JavaScript | 6 | 1 | 1 | 8 |
| [main/src/app/(components)/chat/AIChatBubble.tsx](/main/src/app/(components)/chat/AIChatBubble.tsx) | TypeScript JSX | 193 | 1 | 18 | 212 |
| [main/src/app/(components)/dashboard/ProjectCard.tsx](/main/src/app/(components)/dashboard/ProjectCard.tsx) | TypeScript JSX | 93 | 0 | 9 | 102 |
| [main/src/app/(components)/dashboard/ResourceTable.tsx](/main/src/app/(components)/dashboard/ResourceTable.tsx) | TypeScript JSX | 138 | 0 | 4 | 142 |
| [main/src/app/(components)/dashboard/UsageChart.tsx](/main/src/app/(components)/dashboard/UsageChart.tsx) | TypeScript JSX | 58 | 0 | 1 | 59 |
| [main/src/app/(components)/discuss/CreateDiscussionModal.tsx](/main/src/app/(components)/discuss/CreateDiscussionModal.tsx) | TypeScript JSX | 88 | 1 | 5 | 94 |
| [main/src/app/(components)/discuss/DIscussionCard.tsx](/main/src/app/(components)/discuss/DIscussionCard.tsx) | TypeScript JSX | 60 | 0 | 5 | 65 |
| [main/src/app/(components)/discuss/DiscussionModal.tsx](/main/src/app/(components)/discuss/DiscussionModal.tsx) | TypeScript JSX | 116 | 8 | 11 | 135 |
| [main/src/app/(components)/discuss/TrendingDiscussionCard.tsx](/main/src/app/(components)/discuss/TrendingDiscussionCard.tsx) | TypeScript JSX | 53 | 0 | 3 | 56 |
| [main/src/app/(components)/entities/Comment.json](/main/src/app/(components)/entities/Comment.json) | JSON | 34 | 0 | 1 | 35 |
| [main/src/app/(components)/entities/Discuss.json](/main/src/app/(components)/entities/Discuss.json) | JSON | 47 | 0 | 1 | 48 |
| [main/src/app/(components)/entities/Event.json](/main/src/app/(components)/entities/Event.json) | JSON | 122 | 0 | 1 | 123 |
| [main/src/app/(components)/entities/PeerPoint.json](/main/src/app/(components)/entities/PeerPoint.json) | JSON | 12 | 0 | 2 | 14 |
| [main/src/app/(components)/entities/Project.json](/main/src/app/(components)/entities/Project.json) | JSON | 130 | 0 | 1 | 131 |
| [main/src/app/(components)/entities/Review.json](/main/src/app/(components)/entities/Review.json) | JSON | 77 | 0 | 0 | 77 |
| [main/src/app/(components)/entities/User.ts](/main/src/app/(components)/entities/User.ts) | TypeScript | 55 | 0 | 16 | 71 |
| [main/src/app/(components)/events/EventCalenderView.tsx](/main/src/app/(components)/events/EventCalenderView.tsx) | TypeScript JSX | 150 | 0 | 10 | 160 |
| [main/src/app/(components)/events/EventDetailModal.tsx](/main/src/app/(components)/events/EventDetailModal.tsx) | TypeScript JSX | 131 | 0 | 10 | 141 |
| [main/src/app/(components)/integration/core.ts](/main/src/app/(components)/integration/core.ts) | TypeScript | 75 | 8 | 10 | 93 |
| [main/src/app/(components)/layout/ProfileDropdown.tsx](/main/src/app/(components)/layout/ProfileDropdown.tsx) | TypeScript JSX | 128 | 1 | 18 | 147 |
| [main/src/app/(components)/peerpoint/PeerPointDetailModal.tsx](/main/src/app/(components)/peerpoint/PeerPointDetailModal.tsx) | TypeScript JSX | 70 | 0 | 7 | 77 |
| [main/src/app/(components)/profile/CalenderTab.tsx](/main/src/app/(components)/profile/CalenderTab.tsx) | TypeScript JSX | 265 | 15 | 32 | 312 |
| [main/src/app/(components)/profile/EditProfileModal.tsx](/main/src/app/(components)/profile/EditProfileModal.tsx) | TypeScript JSX | 195 | 0 | 18 | 213 |
| [main/src/app/(components)/ui/CategoryDropdown.tsx](/main/src/app/(components)/ui/CategoryDropdown.tsx) | TypeScript JSX | 124 | 0 | 5 | 129 |
| [main/src/app/(executable)/runs/\[runId\]/layout.tsx](/main/src/app/(executable)/runs/%5BrunId%5D/layout.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [main/src/app/(executable)/runs/\[runId\]/page.tsx](/main/src/app/(executable)/runs/%5BrunId%5D/page.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [main/src/app/(main)/LayoutShell.tsx](/main/src/app/(main)/LayoutShell.tsx) | TypeScript JSX | 150 | 7 | 17 | 174 |
| [main/src/app/(main)/containers/Container.tsx](/main/src/app/(main)/containers/Container.tsx) | TypeScript JSX | 115 | 0 | 13 | 128 |
| [main/src/app/(main)/containers/\[containerId\]/page.tsx](/main/src/app/(main)/containers/%5BcontainerId%5D/page.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [main/src/app/(main)/containers/page.tsx](/main/src/app/(main)/containers/page.tsx) | TypeScript JSX | 4 | 0 | 2 | 6 |
| [main/src/app/(main)/dashboard.tsx](/main/src/app/(main)/dashboard.tsx) | TypeScript JSX | 247 | 0 | 22 | 269 |
| [main/src/app/(main)/discuss/Discuss.tsx](/main/src/app/(main)/discuss/Discuss.tsx) | TypeScript JSX | 129 | 10 | 22 | 161 |
| [main/src/app/(main)/discuss/page.tsx](/main/src/app/(main)/discuss/page.tsx) | TypeScript JSX | 4 | 0 | 2 | 6 |
| [main/src/app/(main)/forgot-password/ForgotPassword.tsx](/main/src/app/(main)/forgot-password/ForgotPassword.tsx) | TypeScript JSX | 40 | 0 | 6 | 46 |
| [main/src/app/(main)/forgot-password/page.tsx](/main/src/app/(main)/forgot-password/page.tsx) | TypeScript JSX | 4 | 0 | 1 | 5 |
| [main/src/app/(main)/layout.tsx](/main/src/app/(main)/layout.tsx) | TypeScript JSX | 22 | 1 | 4 | 27 |
| [main/src/app/(main)/page.jsx](/main/src/app/(main)/page.jsx) | JavaScript JSX | 4 | 0 | 2 | 6 |
| [main/src/app/(main)/peerpoint/PeerPoints.tsx](/main/src/app/(main)/peerpoint/PeerPoints.tsx) | TypeScript JSX | 227 | 0 | 21 | 248 |
| [main/src/app/(main)/peerpoint/page.tsx](/main/src/app/(main)/peerpoint/page.tsx) | TypeScript JSX | 4 | 0 | 0 | 4 |
| [main/src/app/(main)/profile/page.tsx](/main/src/app/(main)/profile/page.tsx) | TypeScript JSX | 4 | 0 | 0 | 4 |
| [main/src/app/(main)/profile/profile.tsx](/main/src/app/(main)/profile/profile.tsx) | TypeScript JSX | 222 | 4 | 26 | 252 |
| [main/src/app/(main)/profile/settings/settings.tsx](/main/src/app/(main)/profile/settings/settings.tsx) | TypeScript JSX | 0 | 333 | 2 | 335 |
| [main/src/app/(main)/projects/ProjectShell.tsx](/main/src/app/(main)/projects/ProjectShell.tsx) | TypeScript JSX | 348 | 8 | 32 | 388 |
| [main/src/app/(main)/projects/page.tsx](/main/src/app/(main)/projects/page.tsx) | TypeScript JSX | 4 | 0 | 2 | 6 |
| [main/src/app/(main)/signIn/SignIn.tsx](/main/src/app/(main)/signIn/SignIn.tsx) | TypeScript JSX | 73 | 1 | 14 | 88 |
| [main/src/app/(main)/signIn/page.tsx](/main/src/app/(main)/signIn/page.tsx) | TypeScript JSX | 4 | 0 | 4 | 8 |
| [main/src/app/(main)/signUp/SignUp.tsx](/main/src/app/(main)/signUp/SignUp.tsx) | TypeScript JSX | 68 | 1 | 17 | 86 |
| [main/src/app/(main)/signUp/page.tsx](/main/src/app/(main)/signUp/page.tsx) | TypeScript JSX | 4 | 0 | 4 | 8 |
| [main/src/app/(main)/unauthorized/page.jsx](/main/src/app/(main)/unauthorized/page.jsx) | JavaScript JSX | 26 | 0 | 3 | 29 |
| [main/src/components/BlackButton.jsx](/main/src/components/BlackButton.jsx) | JavaScript JSX | 24 | 0 | 5 | 29 |
| [main/src/components/Logo.jsx](/main/src/components/Logo.jsx) | JavaScript JSX | 58 | 0 | 4 | 62 |
| [main/src/components/alert.tsx](/main/src/components/alert.tsx) | TypeScript JSX | 88 | 0 | 8 | 96 |
| [main/src/components/auth-layout.tsx](/main/src/components/auth-layout.tsx) | TypeScript JSX | 10 | 0 | 2 | 12 |
| [main/src/components/checkbox.tsx](/main/src/components/checkbox.tsx) | TypeScript JSX | 132 | 19 | 7 | 158 |
| [main/src/components/fieldset.tsx](/main/src/components/fieldset.tsx) | TypeScript JSX | 84 | 0 | 8 | 92 |
| [main/src/components/heading.tsx](/main/src/components/heading.tsx) | TypeScript JSX | 22 | 0 | 6 | 28 |
| [main/src/components/input.tsx](/main/src/components/input.tsx) | TypeScript JSX | 76 | 15 | 4 | 95 |
| [main/src/components/link.tsx](/main/src/components/link.tsx) | TypeScript JSX | 13 | 0 | 1 | 14 |
| [main/src/components/select.tsx](/main/src/components/select.tsx) | TypeScript JSX | 53 | 14 | 2 | 69 |
| [main/src/components/text.tsx](/main/src/components/text.tsx) | TypeScript JSX | 36 | 0 | 5 | 41 |
| [main/src/components/ui/badge.tsx](/main/src/components/ui/badge.tsx) | TypeScript JSX | 41 | 0 | 6 | 47 |
| [main/src/components/ui/button.tsx](/main/src/components/ui/button.tsx) | TypeScript JSX | 54 | 0 | 6 | 60 |
| [main/src/components/ui/calendar.tsx](/main/src/components/ui/calendar.tsx) | TypeScript JSX | 203 | 0 | 11 | 214 |
| [main/src/components/ui/card.tsx](/main/src/components/ui/card.tsx) | TypeScript JSX | 83 | 0 | 10 | 93 |
| [main/src/components/ui/checkbox.tsx](/main/src/components/ui/checkbox.tsx) | TypeScript JSX | 28 | 0 | 5 | 33 |
| [main/src/components/ui/collapsible.tsx](/main/src/components/ui/collapsible.tsx) | TypeScript JSX | 28 | 0 | 6 | 34 |
| [main/src/components/ui/dialog.tsx](/main/src/components/ui/dialog.tsx) | TypeScript JSX | 130 | 0 | 14 | 144 |
| [main/src/components/ui/dropdown-menu.tsx](/main/src/components/ui/dropdown-menu.tsx) | TypeScript JSX | 239 | 0 | 19 | 258 |
| [main/src/components/ui/input.tsx](/main/src/components/ui/input.tsx) | TypeScript JSX | 18 | 0 | 4 | 22 |
| [main/src/components/ui/label.tsx](/main/src/components/ui/label.tsx) | TypeScript JSX | 20 | 0 | 5 | 25 |
| [main/src/components/ui/navigation-menu.tsx](/main/src/components/ui/navigation-menu.tsx) | TypeScript JSX | 157 | 0 | 12 | 169 |
| [main/src/components/ui/popover.tsx](/main/src/components/ui/popover.tsx) | TypeScript JSX | 41 | 0 | 8 | 49 |
| [main/src/components/ui/progress.tsx](/main/src/components/ui/progress.tsx) | TypeScript JSX | 27 | 0 | 5 | 32 |
| [main/src/components/ui/select.tsx](/main/src/components/ui/select.tsx) | TypeScript JSX | 172 | 0 | 14 | 186 |
| [main/src/components/ui/separator.tsx](/main/src/components/ui/separator.tsx) | TypeScript JSX | 24 | 0 | 5 | 29 |
| [main/src/components/ui/sheet.tsx](/main/src/components/ui/sheet.tsx) | TypeScript JSX | 126 | 0 | 14 | 140 |
| [main/src/components/ui/sidebar.tsx](/main/src/components/ui/sidebar.tsx) | TypeScript JSX | 660 | 12 | 55 | 727 |
| [main/src/components/ui/skeleton.tsx](/main/src/components/ui/skeleton.tsx) | TypeScript JSX | 11 | 0 | 3 | 14 |
| [main/src/components/ui/switch.tsx](/main/src/components/ui/switch.tsx) | TypeScript JSX | 27 | 0 | 5 | 32 |
| [main/src/components/ui/table.tsx](/main/src/components/ui/table.tsx) | TypeScript JSX | 105 | 0 | 12 | 117 |
| [main/src/components/ui/tabs.tsx](/main/src/components/ui/tabs.tsx) | TypeScript JSX | 59 | 0 | 8 | 67 |
| [main/src/components/ui/textarea.tsx](/main/src/components/ui/textarea.tsx) | TypeScript JSX | 15 | 0 | 4 | 19 |
| [main/src/components/ui/tooltip.tsx](/main/src/components/ui/tooltip.tsx) | TypeScript JSX | 54 | 0 | 8 | 62 |
| [main/src/data.ts](/main/src/data.ts) | TypeScript | 926 | 0 | 8 | 934 |
| [main/src/hooks/use-mobile.ts](/main/src/hooks/use-mobile.ts) | TypeScript | 15 | 0 | 5 | 20 |
| [main/src/lib/auth-client.ts](/main/src/lib/auth-client.ts) | TypeScript | 5 | 0 | 4 | 9 |
| [main/src/lib/auth.ts](/main/src/lib/auth.ts) | TypeScript | 4 | 0 | 4 | 8 |
| [main/src/lib/formatDate.js](/main/src/lib/formatDate.js) | JavaScript | 10 | 0 | 2 | 12 |
| [main/src/lib/mdx.js](/main/src/lib/mdx.js) | JavaScript | 25 | 0 | 4 | 29 |
| [main/src/lib/utils.ts](/main/src/lib/utils.ts) | TypeScript | 5 | 0 | 2 | 7 |
| [main/src/state/StoreProvider.tsx](/main/src/state/StoreProvider.tsx) | TypeScript JSX | 22 | 0 | 5 | 27 |
| [main/src/state/api.ts](/main/src/state/api.ts) | TypeScript | 83 | 9 | 17 | 109 |
| [main/src/state/dashboardSlice/index.ts](/main/src/state/dashboardSlice/index.ts) | TypeScript | 23 | 4 | 10 | 37 |
| [main/src/state/hooks.ts](/main/src/state/hooks.ts) | TypeScript | 8 | 2 | 4 | 14 |
| [main/src/state/marketSlice/index.ts](/main/src/state/marketSlice/index.ts) | TypeScript | 16 | 1 | 14 | 31 |
| [main/src/state/store.ts](/main/src/state/store.ts) | TypeScript | 53 | 3 | 9 | 65 |
| [main/src/styles/base.css](/main/src/styles/base.css) | PostCSS | 8 | 0 | 1 | 9 |
| [main/src/styles/tailwind.css](/main/src/styles/tailwind.css) | PostCSS | 149 | 0 | 12 | 161 |
| [main/src/styles/typography.css](/main/src/styles/typography.css) | PostCSS | 146 | 8 | 31 | 185 |
| [main/tsconfig.json](/main/tsconfig.json) | JSON with Comments | 41 | 0 | 1 | 42 |
| [native/agent\_core/CMakeLists.txt](/native/agent_core/CMakeLists.txt) | CMake | 0 | 0 | 1 | 1 |
| [native/agent\_core/include/kyntrix/agent\_core.h](/native/agent_core/include/kyntrix/agent_core.h) | C++ | 13 | 0 | 8 | 21 |
| [native/agent\_core/include/kyntrix/config.h](/native/agent_core/include/kyntrix/config.h) | C++ | 13 | 0 | 3 | 16 |
| [native/agent\_core/include/kyntrix/event.h](/native/agent_core/include/kyntrix/event.h) | C++ | 17 | 0 | 3 | 20 |
| [native/agent\_core/include/kyntrix/version.h](/native/agent_core/include/kyntrix/version.h) | C++ | 8 | 0 | 3 | 11 |
| [native/agent\_core/src/agent\_core.cpp](/native/agent_core/src/agent_core.cpp) | C++ | 148 | 8 | 47 | 203 |
| [native/agent\_core/src/logging.cpp](/native/agent_core/src/logging.cpp) | C++ | 25 | 0 | 15 | 40 |
| [native/agent\_core/src/logging.h](/native/agent_core/src/logging.h) | C++ | 6 | 0 | 1 | 7 |
| [package-lock.json](/package-lock.json) | JSON | 118 | 0 | 1 | 119 |
| [package.json](/package.json) | JSON | 8 | 0 | 1 | 9 |
| [servers/agents/db/client.ts](/servers/agents/db/client.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [servers/agents/package-lock.json](/servers/agents/package-lock.json) | JSON | 2,239 | 0 | 1 | 2,240 |
| [servers/agents/package.json](/servers/agents/package.json) | JSON | 32 | 0 | 2 | 34 |
| [servers/agents/pipeline/index.ts](/servers/agents/pipeline/index.ts) | TypeScript | 100 | 0 | 37 | 137 |
| [servers/agents/pipeline/t1\_parser.ts](/servers/agents/pipeline/t1_parser.ts) | TypeScript | 13 | 0 | 6 | 19 |
| [servers/agents/pipeline/t2\_correlator.ts](/servers/agents/pipeline/t2_correlator.ts) | TypeScript | 54 | 1 | 25 | 80 |
| [servers/agents/routers/ingest.ts](/servers/agents/routers/ingest.ts) | TypeScript | 47 | 29 | 21 | 97 |
| [servers/agents/routers/run.ts](/servers/agents/routers/run.ts) | TypeScript | 21 | 0 | 6 | 27 |
| [servers/agents/server.ts](/servers/agents/server.ts) | TypeScript | 14 | 0 | 5 | 19 |
| [servers/agents/storage/redis.ts](/servers/agents/storage/redis.ts) | TypeScript | 22 | 0 | 11 | 33 |
| [servers/agents/testing/ingest-test.ts](/servers/agents/testing/ingest-test.ts) | TypeScript | 68 | 0 | 23 | 91 |
| [servers/agents/testing/ws-test.ts](/servers/agents/testing/ws-test.ts) | TypeScript | 12 | 0 | 5 | 17 |
| [servers/agents/tsconfig.json](/servers/agents/tsconfig.json) | JSON with Comments | 17 | 91 | 9 | 117 |
| [servers/agents/ws/hub.ts](/servers/agents/ws/hub.ts) | TypeScript | 51 | 0 | 26 | 77 |
| [servers/package-lock.json](/servers/package-lock.json) | JSON | 3,415 | 0 | 1 | 3,416 |
| [servers/package.json](/servers/package.json) | JSON | 43 | 0 | 1 | 44 |
| [servers/runtime/native/container/ct\_mount.cpp](/servers/runtime/native/container/ct_mount.cpp) | C++ | 1 | 0 | 2 | 3 |
| [servers/runtime/native/container/ct\_mount.h](/servers/runtime/native/container/ct_mount.h) | C++ | 0 | 0 | 1 | 1 |
| [servers/runtime/src/index.ts](/servers/runtime/src/index.ts) | TypeScript | 13 | 0 | 6 | 19 |
| [servers/runtime/src/lib/nativeBridge.ts](/servers/runtime/src/lib/nativeBridge.ts) | TypeScript | 10 | 0 | 6 | 16 |
| [servers/runtime/src/os/detect.ts](/servers/runtime/src/os/detect.ts) | TypeScript | 17 | 1 | 4 | 22 |
| [servers/runtime/src/routes/containers.ts](/servers/runtime/src/routes/containers.ts) | TypeScript | 6 | 0 | 5 | 11 |
| [servers/runtime/src/routes/hypervisor.ts](/servers/runtime/src/routes/hypervisor.ts) | TypeScript | 6 | 0 | 5 | 11 |
| [servers/runtime/src/scripts/build\_img.sh](/servers/runtime/src/scripts/build_img.sh) | Shell Script | 92 | 11 | 17 | 120 |
| [servers/runtime/src/scripts/limac-kyntrix.yaml](/servers/runtime/src/scripts/limac-kyntrix.yaml) | YAML | 0 | 0 | 1 | 1 |
| [servers/runtime/src/scripts/mac-ensure-limac.sh](/servers/runtime/src/scripts/mac-ensure-limac.sh) | Shell Script | 2 | 0 | 4 | 6 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)