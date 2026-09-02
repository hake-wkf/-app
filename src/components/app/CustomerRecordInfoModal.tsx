import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Building2,
  Phone,
  User,
  FileEdit,
  Save,
  CheckCircle2,
  Sparkles,
  Tag,
  Clock,
  MapPin,
  FileText,
} from 'lucide-react';
import { SavedPlanRecord, UserProfile, Customer } from '../../types';
import { AdminStorageManager } from '../../utils/adminStorage';

interface CustomerRecordInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  activePlan?: SavedPlanRecord | null;
  onUpdateCurrentUser?: (updated: UserProfile) => void;
  onUpdatePlan?: (updatedPlan: SavedPlanRecord) => void;
  onCustomerSaved?: (info: {
    communityName: string;
    phone: string;
    name: string;
    notes: string;
  }) => void;
}

export const CustomerRecordInfoModal: React.FC<CustomerRecordInfoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activePlan,
  onUpdateCurrentUser,
  onUpdatePlan,
  onCustomerSaved,
}) => {
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCommunity, setCustomerCommunity] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Initial load
  useEffect(() => {
    if (isOpen) {
      // Prioritize active plan's customer info if available, else user profile or storage customer
      const defaultName = activePlan?.customerName || currentUser.name || '卫科帆';
      const defaultPhone = activePlan?.customerPhone || currentUser.phone || '17696180841';
      const defaultCommunity =
        activePlan?.communityName || currentUser.communityName || '万科翡翠公园';
      const defaultNotes =
        activePlan?.customerNotes ||
        currentUser.customNotes ||
        '客户对客厅无主灯调光及智能窗帘有强烈意向，希望优先考虑性价比与后期扩展性，预计下周三上门现场勘测。';

      setCustomerName(defaultName);
      setCustomerPhone(defaultPhone);
      setCustomerCommunity(defaultCommunity);
      setCustomerNotes(defaultNotes);
    }
  }, [isOpen, activePlan, currentUser]);

  if (!isOpen) return null;

  const handleQuickInsertTag = (tagText: string) => {
    if (customerNotes.includes(tagText)) return;
    setCustomerNotes((prev) => (prev ? `${prev}；${tagText}` : tagText));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = customerName.trim() || '客户';
    const trimmedPhone = customerPhone.trim() || '17696180841';
    const trimmedCommunity = customerCommunity.trim() || '万科翡翠公园';
    const trimmedNotes = customerNotes.trim();

    // 1. Update UserProfile
    const updatedProfile: UserProfile = {
      ...currentUser,
      name: trimmedName,
      phone: trimmedPhone,
      communityName: trimmedCommunity,
      customNotes: trimmedNotes,
    };
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser(updatedProfile);
    }
    AdminStorageManager.saveUserProfile(updatedProfile);

    // 2. If activePlan provided, update it
    if (activePlan && onUpdatePlan) {
      const updatedPlan: SavedPlanRecord = {
        ...activePlan,
        customerName: trimmedName,
        customerPhone: trimmedPhone,
        communityName: trimmedCommunity,
        customerNotes: trimmedNotes,
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
      };
      onUpdatePlan(updatedPlan);
    }

    // 3. Sync to CRM Customer Database so Admin Web Portal also sees it
    try {
      const existingCustomers = AdminStorageManager.getCustomers();
      const existingIdx = existingCustomers.findIndex(
        (c) => c.phone === trimmedPhone || c.name === trimmedName
      );

      const nowTime = new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16);

      if (existingIdx >= 0) {
        const updatedList = [...existingCustomers];
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          name: trimmedName,
          phone: trimmedPhone,
          projectName: trimmedCommunity,
          detailAddress: `${trimmedCommunity} 专属定制方案`,
          remark: trimmedNotes,
          updatedAt: nowTime,
        };
        AdminStorageManager.saveCustomers(updatedList);
      } else {
        const newCustomer: Customer = {
          id: `cust_${Date.now()}`,
          code: `CUST-${String(existingCustomers.length + 1).padStart(3, '0')}`,
          name: trimmedName,
          projectName: trimmedCommunity,
          phone: trimmedPhone,
          followUpStatus: '已登记客户信息',
          status: '意向客户',
          deliveryStatus: '未交付',
          priceGrade: '高端级别',
          salesperson: '卫科帆',
          creator: '方案工作台',
          createdAt: nowTime,
          updatedAt: nowTime,
          isPool: false,
          region: '北京-朝阳',
          detailAddress: `${trimmedCommunity} 现场登记`,
          source: '方案登记',
          level: 'VIP客户',
          category: '家装客户',
          remark: trimmedNotes,
        };
        AdminStorageManager.saveCustomers([newCustomer, ...existingCustomers]);
      }
    } catch (err) {
      console.error('Failed to sync customer to CRM', err);
    }

    if (onCustomerSaved) {
      onCustomerSaved({
        communityName: trimmedCommunity,
        phone: trimmedPhone,
        name: trimmedName,
        notes: trimmedNotes,
      });
    }

    setToastMsg('客户信息与记录已成功保存！');
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 1200);
  };

  const quickTags = [
    '全屋磁吸调光',
    '中央空调集中控制',
    '双轨电动开合帘',
    '老人起夜微光照明',
    '周末预约现场量房',
    '预算敏感型',
    '要求顺丰保价发货',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-scaleIn flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between relative shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">客户信息登记与档案</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                实时展示与编辑客户基础信息及手输需求记录
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Toast */}
          {showSuccessToast && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center space-x-2 animate-fadeIn font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {activePlan && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] font-bold text-slate-700">当前关联方案：</span>
                <span className="text-[11px] font-semibold text-slate-900 truncate max-w-[200px]">
                  {activePlan.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                ¥{activePlan.totalCostTenThousand}万
              </span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3.5">
            {/* 1. 客户名称 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>客户名称</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400">业主/经办人姓名</span>
              </label>
              <div className="flex items-center space-x-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-800 transition-colors">
                <input
                  type="text"
                  placeholder="例如：卫科帆 / 张总"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs text-slate-900 bg-transparent outline-none font-medium"
                  required
                />
              </div>
            </div>

            {/* 2. 客户联系方式 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>客户联系方式</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400">手机号码 / 微信</span>
              </label>
              <div className="flex items-center space-x-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-800 transition-colors">
                <input
                  type="tel"
                  placeholder="例如：17696180841"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs text-slate-900 bg-transparent outline-none font-mono"
                  required
                />
              </div>
            </div>

            {/* 3. 客户小区 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>客户小区</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400">楼盘社区/具体房号</span>
              </label>
              <div className="flex items-center space-x-2 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-slate-800 transition-colors">
                <input
                  type="text"
                  placeholder="例如：万科翡翠公园 / 西山壹号院"
                  value={customerCommunity}
                  onChange={(e) => setCustomerCommunity(e.target.value)}
                  className="w-full text-xs text-slate-900 bg-transparent outline-none font-medium"
                  required
                />
              </div>
            </div>

            {/* 4. 客户记录(手输) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                  <span>客户记录 (手输)</span>
                  <span className="text-slate-400 font-normal text-[10px]">(跟进需求、特殊备忘)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {customerNotes.length}/300 字
                </span>
              </label>

              {/* Quick Tags Insertion */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <span className="text-[10px] text-slate-400 flex items-center space-x-0.5">
                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                  <span>快捷填入:</span>
                </span>
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickInsertTag(tag)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <div className="border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus-within:bg-white focus-within:border-slate-800 transition-colors">
                <textarea
                  rows={4}
                  placeholder="请输入客户跟进备忘、空间定制特殊要求、现场量房时间或商务沟通细节..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full text-xs text-slate-800 bg-transparent outline-none resize-none leading-relaxed"
                  maxLength={300}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between space-x-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            取消
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存登记信息并同步</span>
          </button>
        </div>
      </div>
    </div>
  );
};
