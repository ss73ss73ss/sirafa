import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { getJwtSecret } from './utils/jwt';

// بيانات المستخدمين المؤقتة
const tempUsers = [
  {
    id: 1,
    email: "ss73ss73ss73@gmail.com",
    password: "123456", // سيتم تشفيرها
    role: "admin",
    account_number: "ACC001",
    name: "المطور الرئيسي",
    status: "active",
    verification_status: "verified"
  },
  {
    id: 2,
    email: "s1@s1.com", 
    password: "12345678",
    role: "user",
    account_number: "ACC002", 
    name: "مستخدم تجريبي",
    status: "active",
    verification_status: "verified"
  },
  {
    id: 3,
    email: "s2@s2.com",
    password: "123456789", 
    role: "user",
    account_number: "ACC003",
    name: "مستخدم تجريبي 2", 
    status: "active",
    verification_status: "verified"
  },
  {
    id: 4,
    email: "s3@s3.com",
    password: "12345678",
    role: "user",
    account_number: "ACC004",
    name: "مستخدم تجريبي 3",
    status: "active", 
    verification_status: "verified"
  }
];

export async function tempLogin(email: string, password: string) {
  console.log('🔍 البحث عن المستخدم المؤقت:', email);
  
  const user = tempUsers.find(u => u.email === email);
  if (!user) {
    console.log('❌ المستخدم غير موجود في النظام المؤقت');
    return null;
  }

  // مقارنة كلمة المرور مباشرة (مؤقت)
  if (password !== user.password) {
    console.log('❌ كلمة المرور غير صحيحة');
    return null;
  }

  console.log('✅ تم العثور على المستخدم وكلمة المرور صحيحة');
  
  // إنشاء JWT token
  const JWT_SECRET = getJwtSecret();
  
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      account_number: user.account_number,
      name: user.name,
      status: user.status,
      verification_status: user.verification_status
    },
    token
  };
}

export function tempGetUserById(id: number) {
  return tempUsers.find(u => u.id === id) || null;
}

export function tempGetUserByEmail(email: string) {
  return tempUsers.find(u => u.email === email) || null;
}