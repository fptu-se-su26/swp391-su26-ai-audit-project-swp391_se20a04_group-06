const fs = require('fs');
const path = require('path');

const appJsx = fs.readFileSync(path.join(__dirname, 'src', 'App.jsx'), 'utf-8');

const sections = appJsx.split(/\/\* [─═]+[\s\n]+(.+?)[\s\n]+[─═]+ \*\//gs);

const contentMap = {};
for (let i = 1; i < sections.length; i += 2) {
  contentMap[sections[i].trim()] = sections[i + 1].trim();
}

const write = (filename, content) => {
  fs.writeFileSync(path.join(__dirname, 'src', filename), content);
  console.log('Created', filename);
};

// 12. pages/HomePage.jsx
write('pages/HomePage.jsx', `import React, { useState, useEffect } from 'react';\nimport { C } from '../utils/theme';\nimport { api } from '../services/api';\nimport { ProductCard } from '../components/ProductCard';\nexport ${contentMap['PAGE: HOME']}`);

// 13. pages/ProductDetailPage.jsx
write('pages/ProductDetailPage.jsx', `import React, { useState, useEffect } from 'react';\nimport { C } from '../utils/theme';\nimport { api } from '../services/api';\nimport { fmt, pill } from '../utils/format';\nimport { ImageSlider } from '../components/ImageSlider';\nimport { MapMini } from '../components/MapMini';\nimport { ChatBox } from '../components/ChatBox';\nexport ${contentMap['PAGE: PRODUCT DETAIL']}`);

// 14. pages/AuthPage.jsx
write('pages/AuthPage.jsx', `import React, { useState } from 'react';\nimport { C } from '../utils/theme';\nimport { api } from '../services/api';\nexport ${contentMap['PAGE: AUTH']}`);

// 15. pages/PostListingPage.jsx
write('pages/PostListingPage.jsx', `import React, { useState, useRef } from 'react';\nimport { C } from '../utils/theme';\nimport { api } from '../services/api';\nexport ${contentMap['PAGE: POST LISTING']}`);

// 16. pages/DashboardPage.jsx
write('pages/DashboardPage.jsx', `import React, { useState, useEffect } from 'react';\nimport { C } from '../utils/theme';\nimport { api } from '../services/api';\nimport { fmt, pill } from '../utils/format';\nimport { useCountdown } from '../hooks/useCountdown';\nimport { CountdownBadge } from '../components/ProductCard';\nimport { ChatBox } from '../components/ChatBox';\nexport ${contentMap['PAGE: DASHBOARD']}`);

// 17. pages/AdminPage.jsx
write('pages/AdminPage.jsx', `import React, { useState, useEffect } from 'react';\nimport { C } from '../utils/theme';\nimport { api } from '../services/api';\nimport { fmt } from '../utils/format';\nexport ${contentMap['PAGE: ADMIN']}`);

// 18. App.jsx
write('App.jsx', `import React, { useState, useEffect } from "react";
import { C } from "./utils/theme";
import { api, getToken, saveToken } from "./services/api";
import { disconnectSocket } from "./services/socket";
import { Navbar } from "./layout/Navbar";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { AuthPage } from "./pages/AuthPage";
import { PostListingPage } from "./pages/PostListingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { ChatBox } from "./components/ChatBox";

${contentMap['ROOT APP'].replace('export default function App', 'export default function App')}
`);

console.log('Refactoring pages and App complete!');
