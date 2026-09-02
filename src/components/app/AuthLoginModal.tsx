import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle2,
  Phone,
  Sparkles,
  UserPlus,
  LogIn,
  Building2,
  FileEdit,
} from 'lucide-react';
import { UserProfile, Customer } from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login
  const [phone, setPhone] = useState(currentUser.phone || '17696180841');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Register
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCommunity, setRegCommunity] = useState('');
  const [regNotes, setRegNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSendSms = () => {
    const targetPhone = tab === 'login' ? phone : regPhone;
    if (!targetPhone || targetPhone.length < 11) {
      setErrorMsg('请输入11位手机号码');
      return;
    }
    setErrorMsg('');
    setCountdown(60);
    setSmsCode('8888');
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 11) {
      setErrorMsg('请输入正确的11位手机号码');
      return;
    }

    const defaultNames: Record<string, string> = {
      '17696180841': '卫科帆',
      '13800138000': '李明 (业主)',
      '13912345678': '陈总 (待审核新客户)',
    };

    const isPending = phone === '13912345678';

    const updatedProfile: UserProfile = {
      ...currentUser,
      id: 'usr_' + phone.slice(-4),
      phone: phone || '17696180841',
      name: defaultNames[phone] || `智家用户_${phone.slice(-4)}`,
      roleTitle: isPending ? '新注册客户 (待审核)' : '智家全屋定制用户',
      city: '北京市 / 朝阳区',
      communityName: isPending ? '西山壹号院' : currentUser.communityName || '万科翡翠公园',
      customNotes: isPending
        ? '新注册业主，全屋4居室计划下周量房，等待Web端后台审核指派商务。'
        : currentUser.customNotes || '全屋智能方案已确认',
      isLoggedIn: true,
      auditStatus: isPending ? 'pending' : 'certified',
    };

    AdminStorageManager.saveUserProfile(updatedProfile);
    onLoginSuccess(updatedProfile);
    onClose();
  };

  const handleFormRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('请输入客户姓名');
      return;
    }
    if (!regPhone || regPhone.length < 11) {
      setErrorMsg('请输入11位手机号');
      return;
    }
    if (!regCommunity.trim()) {
      setErrorMsg('请输入小区名称');
      return;
    }

    const nowTime = new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16);

    const newProfile: UserProfile = {
      id: 'usr_' + Date.now().toString().slice(-6),
      name: regName.trim(),
      phone: regPhone.trim(),
      city: '北京市 / 朝阳区',
      communityName: regCommunity.trim(),
      customNotes: regNotes.trim() || '新客户注册需求登记',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      roleTitle: '新注册业主 (待商务审核)',
      isLoggedIn: true,
      createdAt: nowTime,
      registeredAt: nowTime,
      auditStatus: 'pending',
      auditFeedback: '新客户线上注册，待商务经理分配与资质复核',
      consultantName: '系统待指派',
      consultantPhone: '400-880-9988',
    };

    try {
      const existingCustomers = AdminStorageManager.getCustomers();
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        code: `CUST-${String(existingCustomers.length + 1).padStart(3, '0')}`,
        name: regName.trim(),
        projectName: regCommunity.trim(),
        phone: regPhone.trim(),
        followUpStatus: '【待审核】新注册客户',
        status: '意向客户',
        deliveryStatus: '未交付',
        priceGrade: '高端级别',
        salesperson: '待指派商务',
        creator: '客户自助注册',
        createdAt: nowTime,
        updatedAt: nowTime,
        isPool: true,
        region: '北京-朝阳',
        detailAddress: `${regCommunity.trim()} 客户登记`,
        source: '线上注册',
        level: '普通客户',
        category: '家装客户',
        remark: regNotes.trim() || '线上注册客户',
      };
      AdminStorageManager.saveCustomers([newCustomer, ...existingCustomers]);
    } catch (err) {
      console.error(err);
    }

    AdminStorageManager.saveUserProfile(newProfile);
    setSuccessMsg('注册成功！已提交Web端后台审核');
    setTimeout(() => {
      onLoginSuccess(newProfile);
      onClose();
    }, 800);
  };

  const handleQuickSwitch = (name: string, phoneNum: string, audit: 'certified' | 'pending') => {
    const profile: UserProfile = {
      ...currentUser,
      id: 'usr_' + phoneNum.slice(-4),
      phone: phoneNum,
      name: name,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      roleTitle: audit === 'certified' ? '智家全屋定制用户' : '新注册客户 (待审核)',
      city: '北京市 / 朝阳区',
      communityName: audit === 'certified' ? '万科翡翠公园' : '西山壹号院',
      isLoggedIn: true,
      auditStatus: audit,
    };

    AdminStorageManager.saveUserProfile(profile);
    onLoginSuccess(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 animate-scaleIn flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-black shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">智家客户中心</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                登录/注册即可在Web端与移动端同步方案与审核
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="p-3 pb-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>登录</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg('');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>客户注册</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-1.5 font-medium">
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleFormLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">手机号码</label>
                <div className="flex items-center space-x-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-800 transition-colors">
                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="tel"
                    placeholder="请输入11位手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs text-slate-800 bg-transparent outline-none font-mono"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">短信验证码</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 flex items-center space-x-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-800 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="验证码"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      className="w-full text-xs text-slate-800 bg-transparent outline-none font-mono"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={countdown > 0}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                      countdown > 0
                        ? 'bg-slate-100 text-slate-400 border border-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
                {countdown > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-1">测试默认验证码: 8888</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>立即登录</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleFormRegister} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  客户姓名 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="如：卫科帆"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-xs text-slate-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  手机号码 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="11位手机号码"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-xs text-slate-900 outline-none font-mono"
                  maxLength={11}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  所属小区 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="如：万科翡翠公园"
                  value={regCommunity}
                  onChange={(e) => setRegCommunity(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-xs text-slate-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  客户手输记录/备注
                </label>
                <textarea
                  rows={2}
                  placeholder="填写装修与智能需求..."
                  value={regNotes}
                  onChange={(e) => setRegNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-slate-50 text-xs text-slate-900 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>注册并提交Web端审核</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Quick Switch */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold mb-2">快速切换测试账号:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickSwitch('卫科帆', '17696180841', 'certified')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-xs truncate">卫科帆</div>
                <div className="text-[10px] text-slate-500 font-mono">17696180841 · 已认证</div>
              </button>

              <button
                onClick={() => handleQuickSwitch('陈总', '13912345678', 'pending')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-800 text-xs truncate">陈总 (新客)</div>
                <div className="text-[10px] text-amber-600 font-mono">待Web后台审核</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
