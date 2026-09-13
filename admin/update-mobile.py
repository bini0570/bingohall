import re

with open('c:/Users/User/Videos/Platform/Platform/admin/AdminView.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add isMobile to state
code = code.replace("const [sidebarOpen, setSidebarOpen] = useState(true);", 
                    "const [sidebarOpen, setSidebarOpen] = useState(true);\n  const [isMobile, setIsMobile] = useState(false);")

# 2. Update window resize effect
old_effect = """  useEffect(() => {
    const check = () => setSidebarOpen(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);"""

new_effect = """  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);"""

code = code.replace(old_effect, new_effect)

# 3. Update sidebar style definition to take isMobile
code = code.replace("  sidebar: (open) => ({", "  sidebar: (open, isMobile) => ({")

old_sidebar_style = """    width: open ? '240px' : '0px',
    minWidth: open ? '240px' : '0px',
    background: 'rgba(15,23,42,0.97)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: open ? '16px 10px' : '0',
    gap: '4px',
    overflow: 'hidden',
    transition: 'all 0.25s ease',
    flexShrink: 0,
    zIndex: 100,
  }),"""

new_sidebar_style = """    width: open ? '260px' : '0px',
    minWidth: open ? '260px' : '0px',
    background: 'rgba(15,23,42,0.98)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: open ? '16px 12px' : '0',
    gap: '6px',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
    zIndex: 9999,
    position: isMobile ? 'fixed' : 'relative',
    top: 0,
    bottom: 0,
    left: 0,
    boxShadow: (isMobile && open) ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
  }),"""

code = code.replace(old_sidebar_style, new_sidebar_style)

# 4. Update the sidebar rendering in JSX
old_sidebar_jsx = """        <aside style={S.sidebar(sidebarOpen)}>"""
new_sidebar_jsx = """        {isMobile && sidebarOpen && (
          <div 
            style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9998, backdropFilter:'blur(2px)'}} 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside style={S.sidebar(sidebarOpen, isMobile)}>"""

code = code.replace(old_sidebar_jsx, new_sidebar_jsx)


with open('c:/Users/User/Videos/Platform/Platform/admin/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("AdminView updated successfully!")
