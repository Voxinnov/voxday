import React from 'react';
import { Smartphone, Download, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

const DownloadApp: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: Illustration/Hero */}
                <div className="md:w-1/2 bg-primary-600 p-12 flex flex-col items-center justify-center text-white relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="bg-white/20 p-6 rounded-full mb-8 backdrop-blur-sm">
                        <Smartphone className="h-20 w-20 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-center mb-4">Smart Daybook</h1>
                    <p className="text-primary-100 text-center text-lg max-w-xs">
                        Manage your personal finances and tasks on the go with our Flutter-powered mobile experience.
                    </p>
                    <div className="mt-12 flex space-x-4">
                        <div className="flex flex-col items-center">
                            <Zap className="h-6 w-6 text-yellow-400 mb-2" />
                            <span className="text-xs font-medium">Fast</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <ShieldCheck className="h-6 w-6 text-green-400 mb-2" />
                            <span className="text-xs font-medium">Secure</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <CheckCircle className="h-6 w-6 text-blue-400 mb-2" />
                            <span className="text-xs font-medium">Reliable</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Download Actions */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Download for Android</h2>
                        <p className="text-gray-500">Get the latest version of the Smart Daybook APK.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">v1.2.0 (Stable)</h3>
                                    <p className="text-sm text-gray-500 italic">Released March 2026</p>
                                </div>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Latest
                                </span>
                            </div>

                            <a
                                href="/downloads/smart_daybook.apk"
                                download
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-primary-200 group"
                            >
                                <Download className="h-5 w-5 mr-3 group-hover:translate-y-1 transition-transform" />
                                Download APK (24 MB)
                            </a>
                        </div>

                        <div className="border-t border-gray-100 pt-8">
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-widest">Installation Steps</h4>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="bg-primary-50 text-primary-600 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">1</div>
                                    <p className="text-sm text-gray-600">Download the APK file above to your Android device.</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-primary-50 text-primary-600 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">2</div>
                                    <p className="text-sm text-gray-600">Open the file. If prompted, allow installations from "Unknown Sources" in your browser or file manager settings.</p>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-primary-50 text-primary-600 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">3</div>
                                    <p className="text-sm text-gray-600">Follow the installation prompts and launch the app!</p>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-between text-xs text-gray-400">
                        <span>Powered by VOXDAY Infrastructure</span>
                        <div className="flex space-x-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>Server status: Online</span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-gray-400 text-sm">
                Need help? Contact <a href="mailto:support@voxday.com" className="text-primary-600 hover:underline">Support</a>
            </p>
        </div>
    );
};

export default DownloadApp;
