'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore, type Department } from '@/lib/store';
import { Info, Camera } from 'lucide-react';

const DEPARTMENTS: Department[] = ['Web Design', 'MERN Stack', 'Web Development', 'SEO'];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';

export default function ProfilePage() {
  const { currentUser, updateUser } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name);
    setCnic(currentUser.cnic ?? '');
    setDepartment(currentUser.department ?? '');
    setEmail(currentUser.email);
    setPhone(currentUser.phone ?? '');
    setAddress(currentUser.address ?? '');
    setAvatar(currentUser.avatar);
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        No profile data. Please sign in.
      </div>
    );
  }

  const displayAvatar =
    avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0ea5e9&color=fff&size=256`;

  const uniqueId = currentUser.employeeCode || currentUser.id;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      alert('Name and email are required.');
      return;
    }
    updateUser(currentUser.id, {
      name: trimmedName,
      email: trimmedEmail,
      cnic: cnic.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      department: department || undefined,
      avatar,
    });
    alert('Profile saved.');
  };

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <h1 className="mb-6 text-2xl font-light tracking-tight text-sky-600">Profile</h1>

      <div className="mb-8 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-700">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden />
        <p>
          Edit your details below and click <strong>Save changes</strong>. Unique ID is system-assigned and cannot be
          changed here.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md ring-1 ring-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white shadow-md ring-2 ring-white transition hover:bg-sky-700"
              title="Upload photo"
              aria-label="Upload profile photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">CNIC</label>
            <input className={inputClass} value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="35202-0000000-0" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</label>
            <select
              className={inputClass}
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department | '')}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</label>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 …" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unique ID</label>
            <input className={`${inputClass} cursor-not-allowed bg-slate-100/90`} readOnly value={uniqueId} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Addresses</label>
            <textarea
              rows={3}
              className={`${inputClass} resize-y`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, country…"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-6">
          <button
            type="submit"
            className="rounded-xl bg-sky-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
