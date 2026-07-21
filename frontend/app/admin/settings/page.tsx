// app/admin/settings/page.tsx

'use client';
import { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Save, Loader2, ShieldCheck, Lock, Pencil, Eye, EyeOff, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GeneralSettings() {
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  // 管理员邮箱状态（用于找回密码验证）
  const [adminEmail, setAdminEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // 1. 网站基础信息状态 (这里增加了 author)
  const [siteInfo, setSiteInfo] = useState({ 
    site_name: '', 
    description: '', 
    favicon: '',
    author: '' // ✨ 新增字段
  });

  // 2. 管理员账号修改状态
  const [authForm, setAuthForm] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  // 密码明文/密文切换（点击眼睛图标查看已输入内容）
  const [showPassword, setShowPassword] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  // 获取配置
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSiteInfo({
          site_name: data.site_name || '',
          description: data.description || '',
          favicon: data.favicon || '',
          author: data.author || '' // ✨ 从后端读取作者名
        });
      }
      // 拉取当前管理员邮箱
      const profRes = await fetch('/api/admin/profile', { headers: getAuthHeaders() });
      if (profRes.ok) {
        const prof = await profRes.json();
        setAdminEmail(prof.email || '');
      }
    } catch (err) {
      console.error("读取后端配置失败:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 保存管理员邮箱（用于找回密码验证）
  const handleSaveEmail = async () => {
    const email = adminEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("⚠️ 邮箱格式不正确，请检查");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert("✅ 管理员邮箱已保存！找回密码时将使用此邮箱验证");
      } else {
        const errorData = await res.json();
        alert(`❌ 保存失败: ${errorData.error || '未知错误'}`);
      }
    } catch (err) {
      alert("保存失败，请检查后端服务");
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 保存网站全局配置
  const handleSaveSiteInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(siteInfo),
      });
      if (res.ok) {
        alert("✅ 网站配置保存成功！");
		
		// ✨动态更新浏览器标签页图标
		if (siteInfo.favicon) {
		// 添加时间戳参数 (?t=...) 强制浏览器忽略缓存，重新请求图片
		  const newIconUrl = `${siteInfo.favicon}?t=${new Date().getTime()}`;
		
		  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
		  if (!link) {
		    link = document.createElement('link');
		    link.rel = 'icon';
		    document.head.appendChild(link);
		  }
		  link.href = newIconUrl;
		}
		
      } else {
        alert("❌ 保存失败，请检查后端服务");
      }
    } catch (err) {
      alert("保存失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  // 修改管理员账号密码
  const handleChangeAuth = async () => {
    if (!authForm.currentPassword || !authForm.password || !authForm.confirmPassword) {
      alert("⚠️ 请填写当前密码、新密码和确认密码");
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      alert("⚠️ 两次输入的新密码不一致，请检查");
      return;
    }

    if (!confirm("修改密码后需要重新登录，确定继续吗？")) return;

    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ old_password: authForm.currentPassword, new_password: authForm.password })
      });

      if (res.ok) {
        alert("🎉 密码修改成功！请使用新密码重新登录。");
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      } else {
        const errorData = await res.json();
        alert(`❌ 修改失败: ${errorData.error || '未知错误'}`);
      }
    } catch (err) {
      alert("修改失败，请检查后端服务");
    } finally {
      setAuthLoading(false);
    }
  };

  // 图标上传
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('icon_file', file);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/upload-icon', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setSiteInfo(prev => ({ ...prev, favicon: data.url }));
        alert("图片上传成功，请务必点击[保存全局配置]写入数据库");
      }
    } catch (err) {
      alert("上传失败");
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-[var(--color-text-secondary)] font-medium">正在同步系统设置...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl p-6 md:p-10 space-y-12">
      
      {/* 模块一：基本设置 */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
          <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">基本设置</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 网站名称 */}
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">网站名称</label>
                <input 
                  className="w-full p-4 border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-secondary)] shadow-sm text-[var(--color-text-primary)]"
                  value={siteInfo.site_name} 
                  onChange={e => setSiteInfo({...siteInfo, site_name: e.target.value})}
                  placeholder="例如：沐沐言的博客"
                />
              </div>
              {/* ✨ 新增：默认作者名字 */}
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">默认作者名</label>
                <div className="relative">
                  <input 
                    className="w-full p-4 pl-11 border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-secondary)] shadow-sm text-[var(--color-text-primary)]"
                    value={siteInfo.author} 
                    onChange={e => setSiteInfo({...siteInfo, author: e.target.value})}
                    placeholder="默认展示的文章作者"
                  />
                  <Pencil className="w-4 h-4 text-[var(--color-text-tertiary)] absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">网站描述 (SEO)</label>
              <textarea 
                className="w-full p-4 border border-[var(--color-border)] rounded-2xl h-32 outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-secondary)] shadow-sm text-[var(--color-text-primary)]"
                value={siteInfo.description}
                onChange={e => setSiteInfo({...siteInfo, description: e.target.value})}
                placeholder="请输入网站描述，有助于搜索优化..."
              />
            </div>
            <button 
              onClick={handleSaveSiteInfo} 
              disabled={loading} 
              className="flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:bg-[var(--color-text-tertiary)] shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              保存全局配置
            </button>
          </div>

          <div className="bg-[var(--color-bg-tertiary)] p-8 rounded-[2.5rem] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center">
             <div className="w-32 h-32 bg-[var(--color-bg-secondary)] rounded-3xl shadow-xl flex items-center justify-center overflow-hidden relative group border-4 border-[var(--color-bg-secondary)]">
                {siteInfo.favicon ? (
                  <img src={siteInfo.favicon} className="w-full h-full object-contain p-2" alt="favicon" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-[var(--color-text-tertiary)]" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload className="text-white w-8 h-8" />
                  <input type="file" className="hidden" onChange={handleIconUpload} accept="image/*" />
                </label>
             </div>
             <p className="mt-6 text-xs text-[var(--color-text-tertiary)] text-center font-bold leading-relaxed">
               点击上方预览区更换图标<br/>
               <span className="text-blue-500">建议尺寸 512x512 PNG</span>
             </p>
          </div>
        </div>
      </section>

      {/* 模块二：安全设置 (代码未变动) */}
      <section className="pt-10 border-t border-[var(--color-border)] space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-red-500 rounded-full"></div>
          <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">安全设置</h2>
        </div>

        <div className="bg-[var(--color-bg-secondary)] p-8 md:p-10 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm space-y-6">
          <div className="flex items-start gap-4 mb-2">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[var(--color-text-primary)]">管理员邮箱</h4>
              <p className="text-[var(--color-text-secondary)] text-sm">用于找回密码时接收验证码；本地部署验证码将打印在后端日志（docker logs leleblog-api）</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] ml-1">
              <Mail className="w-4 h-4" /> 邮箱地址
            </label>
            <input
              type="email"
              className="w-full p-4 border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[var(--color-bg-tertiary)]/50 text-[var(--color-text-primary)]"
              placeholder="例如：you@example.com"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-start">
            <button
              onClick={handleSaveEmail}
              disabled={emailLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:bg-[var(--color-text-tertiary)] shadow-lg shadow-blue-200"
            >
              {emailLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              保存管理员邮箱
            </button>
          </div>
        </div>

        <div className="bg-[var(--color-bg-secondary)] p-8 md:p-10 rounded-[2.5rem] border border-[var(--color-border)] shadow-sm space-y-8">
          <div className="flex items-start gap-4 mb-2">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[var(--color-text-primary)]">修改管理员密码</h4>
              <p className="text-[var(--color-text-secondary)] text-sm">更新后您将需要使用新密码重新进入系统</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* 当前密码 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] ml-1">
                <Lock className="w-4 h-4" /> 当前密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full p-4 pr-12 border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all bg-[var(--color-bg-tertiary)]/50 text-[var(--color-text-primary)]"
                  placeholder="请输入当前登录密码"
                  onChange={e => setAuthForm({...authForm, currentPassword: e.target.value})}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" aria-label={showPassword ? '隐藏密码' : '显示密码'}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {/* 新密码 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] ml-1">
                <Lock className="w-4 h-4" /> 新密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full p-4 pr-12 border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all bg-[var(--color-bg-tertiary)]/50 text-[var(--color-text-primary)]"
                  placeholder="输入高强度新密码"
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" aria-label={showPassword ? '隐藏密码' : '显示密码'}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {/* 确认新密码 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)] ml-1">
                <Lock className="w-4 h-4" /> 确认新密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full p-4 pr-12 border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all bg-[var(--color-bg-tertiary)]/50 text-[var(--color-text-primary)]"
                  placeholder="再次输入新密码以确认"
                  onChange={e => setAuthForm({...authForm, confirmPassword: e.target.value})}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" aria-label={showPassword ? '隐藏密码' : '显示密码'}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] ml-1 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> 点击眼睛图标可查看已输入内容；确认密码需与新密码完全一致
            </p>
          </div>

          <div className="flex justify-start">
            <button 
              onClick={handleChangeAuth}
              disabled={authLoading}
              className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-black active:scale-95 transition-all disabled:bg-[var(--color-text-tertiary)] shadow-xl"
            >
              {authLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
              立即更新账号信息
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}