import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Career() {
  const { user } = useAuth();

  const skills = [
    { name: "Workflow Automation", level: 95, category: "Technical" },
    { name: "API Integration", level: 90, category: "Technical" },
    { name: "Data Processing", level: 85, category: "Technical" },
    { name: "System Design", level: 88, category: "Technical" },
    { name: "Project Management", level: 92, category: "Leadership" },
    { name: "Team Collaboration", level: 90, category: "Leadership" }
  ];

  const certifications = [
    {
      name: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2024",
      status: "Valid"
    },
    {
      name: "Certified Automation Professional",
      issuer: "Automation Institute",
      date: "2024",
      status: "Valid"
    },
    {
      name: "Agile Project Management",
      issuer: "PMI",
      date: "2023",
      status: "Valid"
    }
  ];

  const achievements = [
    {
      title: "Automation Excellence Award",
      description: "Reduced manual processing time by 75% through innovative workflow design",
      date: "2024"
    },
    {
      title: "Innovation Leadership",
      description: "Led team that delivered 15+ successful automation projects",
      date: "2024"
    },
    {
      title: "Technical Mentorship",
      description: "Mentored 8 junior developers in automation best practices",
      date: "2023"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Career Development</h1>
          <p className="text-gray-600 mt-2">Track your professional growth and achievements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Years Experience</h3>
            <div className="text-3xl font-bold text-blue-600">8+</div>
            <p className="text-sm text-gray-500">Automation & Integration</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects Completed</h3>
            <div className="text-3xl font-bold text-green-600">50+</div>
            <p className="text-sm text-gray-500">Successful deliveries</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Size</h3>
            <div className="text-3xl font-bold text-purple-600">12</div>
            <p className="text-sm text-gray-500">Current team members</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skills Assessment</h2>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                    <span className="text-sm text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400">{skill.category}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Certifications</h2>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="border-l-4 border-green-400 pl-4">
                  <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                  <p className="text-gray-600">{cert.issuer}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500">{cert.date}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {cert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                  <span className="text-sm text-gray-500">{achievement.date}</span>
                </div>
                <p className="text-gray-600 text-sm">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Career Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Short-term (6 months)</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Complete advanced AI/ML automation certification
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Lead cross-functional automation initiative
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Mentor 3 additional team members
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Long-term (2 years)</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Advance to Senior Automation Architect role
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Establish center of excellence for automation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Contribute to open-source automation tools
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}