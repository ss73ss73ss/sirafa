import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-neutral-500 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">صرافة الخليج</h3>
            <p className="text-neutral-200 mb-4">
              شريككم الموثوق في عالم الصرافة والخدمات المالية منذ أكثر من 20 عاماً.
            </p>
            <div className="flex space-x-4 space-x-reverse">
              <a href="#" className="text-white hover:text-accent transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="text-white hover:text-accent transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" className="text-white hover:text-accent transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="text-white hover:text-accent transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-neutral-200 hover:text-white transition">الرئيسية</Link></li>
              <li><a href="#services" className="text-neutral-200 hover:text-white transition">خدماتنا</a></li>
              <li><a href="#rates" className="text-neutral-200 hover:text-white transition">أسعار العملات</a></li>
              <li><a href="#about" className="text-neutral-200 hover:text-white transition">من نحن</a></li>
              <li><a href="#news" className="text-neutral-200 hover:text-white transition">الأخبار</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">الدعم</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-200 hover:text-white transition">الأسئلة الشائعة</a></li>
              <li><a href="#" className="text-neutral-200 hover:text-white transition">سياسة الخصوصية</a></li>
              <li><a href="#" className="text-neutral-200 hover:text-white transition">الشروط والأحكام</a></li>
              <li><a href="#" className="text-neutral-200 hover:text-white transition">المساعدة</a></li>
              <li><a href="#contact" className="text-neutral-200 hover:text-white transition">اتصل بنا</a></li>
            </ul>
          </div>
          
          <div id="contact">
            <h3 className="text-xl font-bold mb-4">اتصل بنا</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 space-x-reverse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-neutral-200">طرابلس, بنغازي, سبها, ليبيا</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-neutral-200">+966 12 345 6789</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-neutral-200">info@gulfexchange.com</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-neutral-200">السبت - الخميس: 9:00 - 18:00</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-400 pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-300 text-sm mb-4 md:mb-0">© 2023 صرافة الخليج. جميع الحقوق محفوظة.</p>
            <div className="flex space-x-4 space-x-reverse">
              <div className="h-8 w-16 bg-neutral-700 rounded-md"></div>
              <div className="h-8 w-16 bg-neutral-700 rounded-md"></div>
              <div className="h-8 w-16 bg-neutral-700 rounded-md"></div>
              <div className="h-8 w-16 rounded-md bg-[#404040]">للشركة</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
