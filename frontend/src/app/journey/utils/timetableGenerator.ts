import jsPDF from 'jspdf';
import { createEvent, EventAttributes } from 'ics';
import { format, addDays, parseISO } from 'date-fns';

export interface RoadmapModule {
  module_name?: string;
  name?: string;
  description?: string;
  estimated_duration?: string;
  topics?: Array<{
    topic_name?: string;
    name?: string;
    description?: string;
    estimated_duration?: string;
    subtopics?: Array<{
      id?: string;
      title?: string;
      name?: string;
      description?: string;
      estimated_duration?: string;
    }>;
  }>;
}

export interface RoadmapData {
  id?: number;
  title?: string;
  description?: string;
  subject?: string;
  goal?: string;
  time_value?: number;
  time_unit?: string;
  roadmap_plan?: {
    modules?: RoadmapModule[];
  } | RoadmapModule[];
}

export class TimetableGenerator {
  private async addMentorBranding(doc: jsPDF, pageWidth: number) {
    // Add watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.text('MENTTOR', pageWidth / 2, 150, { align: 'center', angle: -45 });
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    
    // Add logo to header if available
    try {
      const logoResponse = await fetch('/logo.png');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoDataUrl = await this.blobToDataURL(logoBlob);
        doc.addImage(logoDataUrl, 'PNG', 20, 12, 16, 16);
        
        // Add text next to logo
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('MENTTOR Learning Platform', 42, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Your Smart Learning Companion', 42, 26);
      } else {
        // Fallback if logo not found
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('MENTTOR Learning Platform', 20, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Your Smart Learning Companion', 20, 28);
      }
    } catch (error) {
      console.warn('Could not load logo, using text fallback:', error);
      // Fallback if logo loading fails
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MENTTOR Learning Platform', 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Your Smart Learning Companion', 20, 28);
    }
    
    // Add footer with updated branding
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Crafted by Menttor.live - Your Smart Learning Companion', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private calculateDuration(timeStr: string): number {
    // Extract number from string like "2-3 hours", "30 minutes", "1 week"
    const match = timeStr.match(/(\d+)/);
    const num = match ? parseInt(match[1]) : 1;
    
    if (timeStr.includes('hour')) return num * 60; // Convert to minutes
    if (timeStr.includes('day')) return num * 24 * 60; // Convert to minutes
    if (timeStr.includes('week')) return num * 7 * 24 * 60; // Convert to minutes
    if (timeStr.includes('minute')) return num;
    
    return 60; // Default to 1 hour
  }

  private generateSchedule(roadmapData: RoadmapData | null | undefined) {
    const schedule: Array<{
      title: string;
      description: string;
      duration: number; // in minutes
      startDate: Date;
      type: 'module' | 'topic' | 'subtopic';
      moduleIndex?: number;
      topicIndex?: number;
    }> = [];

    if (!roadmapData) {
      return schedule;
    }

    const totalDurationMinutes = (roadmapData.time_value || 1) * (
      (roadmapData.time_unit || '').includes('day') ? 24 * 60 :
      (roadmapData.time_unit || '').includes('week') ? 7 * 24 * 60 :
      (roadmapData.time_unit || '').includes('hour') ? 60 : 60
    );

    let currentDate = new Date();
    let cumulativeMinutes = 0;

    // Handle different roadmap data structures
    let modules: RoadmapModule[] = [];
    if (roadmapData.roadmap_plan) {
      if (Array.isArray(roadmapData.roadmap_plan)) {
        // roadmap_plan is directly an array of modules
        modules = roadmapData.roadmap_plan;
      } else if (roadmapData.roadmap_plan.modules) {
        // roadmap_plan is an object with modules property
        modules = roadmapData.roadmap_plan.modules;
      }
    }
    
    if (!modules || !Array.isArray(modules)) {
      console.warn('No valid modules found in roadmap data');
      return schedule;
    }

    modules.forEach((module, moduleIndex) => {
      const moduleDuration = this.calculateDuration(module.estimated_duration || '1 hour');
      
      schedule.push({
        title: module.module_name || module.name || `Module ${moduleIndex + 1}`,
        description: module.description || '',
        duration: moduleDuration,
        startDate: new Date(currentDate),
        type: 'module',
        moduleIndex
      });

      // Space out learning sessions (assume 2 hours per day)
      const dailyStudyMinutes = 120;
      const daysForModule = Math.ceil(moduleDuration / dailyStudyMinutes);
      
      const topics = module.topics || [];
      topics.forEach((topic, topicIndex) => {
        const topicDuration = this.calculateDuration(topic.estimated_duration || '30 minutes');
        
        schedule.push({
          title: topic.topic_name || topic.name || `Topic ${topicIndex + 1}`,
          description: topic.description || '',
          duration: topicDuration,
          startDate: new Date(currentDate),
          type: 'topic',
          moduleIndex,
          topicIndex
        });

        const subtopics = topic.subtopics || [];
        subtopics.forEach((subtopic) => {
          const subtopicDuration = this.calculateDuration(subtopic.estimated_duration || '15 minutes');
          
          schedule.push({
            title: subtopic.title || subtopic.name || 'Subtopic',
            description: subtopic.description || '',
            duration: subtopicDuration,
            startDate: new Date(currentDate),
            type: 'subtopic',
            moduleIndex,
            topicIndex
          });

          cumulativeMinutes += subtopicDuration;
          
          // Move to next study session
          if (cumulativeMinutes >= dailyStudyMinutes) {
            currentDate = addDays(currentDate, Math.floor(cumulativeMinutes / dailyStudyMinutes));
            cumulativeMinutes = cumulativeMinutes % dailyStudyMinutes;
          }
        });
      });
      
      // Add buffer between modules
      currentDate = addDays(currentDate, 1);
      cumulativeMinutes = 0;
    });

    return schedule;
  }

  public async generatePDF(roadmapData: RoadmapData | null | undefined): Promise<void> {
    try {
      if (!roadmapData) {
        throw new Error('No roadmap data provided');
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
    
    // Add branding
    await this.addMentorBranding(doc, pageWidth);
    
    let yPosition = 45;
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(roadmapData.title || 'Learning Roadmap', 20, yPosition);
    yPosition += 10;
    
    // Description
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const description = roadmapData.description || 'No description available';
    const descriptionLines = doc.splitTextToSize(description, pageWidth - 40);
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 5 + 10;
    
    // Duration info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const timeValue = roadmapData.time_value || 1;
    const timeUnit = roadmapData.time_unit || 'week';
    doc.text(`Duration: ${timeValue} ${timeUnit}`, 20, yPosition);
    yPosition += 15;
    
    // Schedule header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Learning Schedule', 20, yPosition);
    yPosition += 10;
    
    // Generate schedule
    const schedule = this.generateSchedule(roadmapData);
    
    doc.setFontSize(9);
    
    // Handle different roadmap data structures
    let modules: RoadmapModule[] = [];
    if (roadmapData.roadmap_plan) {
      if (Array.isArray(roadmapData.roadmap_plan)) {
        // roadmap_plan is directly an array of modules
        modules = roadmapData.roadmap_plan;
      } else if (roadmapData.roadmap_plan.modules) {
        // roadmap_plan is an object with modules property
        modules = roadmapData.roadmap_plan.modules;
      }
    }
    
    if (!modules || !Array.isArray(modules)) {
      doc.setFontSize(12);
      doc.text('No modules found in roadmap data', 20, yPosition);
      const fileName = (roadmapData.title || 'roadmap').replace(/[^a-z0-9]/gi, '_');
      doc.save(`${fileName}_timetable.pdf`);
      return;
    }
    
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        await this.addMentorBranding(doc, pageWidth);
        yPosition = 45;
      }
      
      // Module header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204); // Blue color
      const moduleTitle = module.module_name || module.name || `Module ${moduleIndex + 1}`;
      doc.text(`Module ${moduleIndex + 1}: ${moduleTitle}`, 20, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const moduleDesc = module.description || 'No description available';
      const moduleDescLines = doc.splitTextToSize(moduleDesc, pageWidth - 45);
      doc.text(moduleDescLines, 25, yPosition);
      yPosition += moduleDescLines.length * 4 + 2;
      
      doc.setTextColor(100, 100, 100);
      const duration = module.estimated_duration || '1 hour';
      doc.text(`Estimated Duration: ${duration}`, 25, yPosition);
      yPosition += 8;
      
      // Topics and subtopics
      const topics = module.topics || [];
      for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
        const topic = topics[topicIndex];
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          await this.addMentorBranding(doc, pageWidth);
          yPosition = 45;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const topicName = topic.topic_name || topic.name || `Topic ${topicIndex + 1}`;
        doc.text(`  ${topicIndex + 1}. ${topicName}`, 25, yPosition);
        yPosition += 5;
        
        const subtopics = topic.subtopics || [];
        for (let subtopicIndex = 0; subtopicIndex < subtopics.length; subtopicIndex++) {
          const subtopic = subtopics[subtopicIndex];
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            await this.addMentorBranding(doc, pageWidth);
            yPosition = 45;
          }
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          const subtopicName = subtopic.title || subtopic.name || 'Subtopic';
          const subtopicTitle = `    • ${subtopicName}`;
          const titleLines = doc.splitTextToSize(subtopicTitle, pageWidth - 55);
          doc.text(titleLines, 30, yPosition);
          yPosition += titleLines.length * 4 + 1;
        }
        
        yPosition += 3;
      }
      
      yPosition += 5;
    }
    
    // Study tips section
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      await this.addMentorBranding(doc, pageWidth);
      yPosition = 45;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 102, 204);
    doc.text('Study Tips', 20, yPosition);
    yPosition += 10;
    
    const tips = [
      '• Schedule 1-2 hours of focused study time daily',
      '• Take regular breaks using the Pomodoro Technique',
      '• Review previous topics before starting new ones',
      '• Practice active recall and spaced repetition',
      '• Join study groups or find an accountability partner',
      '• Track your progress and celebrate milestones'
    ];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    for (const tip of tips) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        await this.addMentorBranding(doc, pageWidth);
        yPosition = 45;
      }
      doc.text(tip, 25, yPosition);
      yPosition += 6;
    }
    
    // Download the PDF
    const fileName = (roadmapData.title || 'roadmap').replace(/[^a-z0-9]/gi, '_');
    doc.save(`${fileName}_timetable.pdf`);
    
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  public generateCalendarEvents(roadmapData: RoadmapData | null | undefined): string {
    try {
      if (!roadmapData) {
        console.error('No roadmap data provided for calendar generation');
        return '';
      }

      const schedule = this.generateSchedule(roadmapData);
      const events: EventAttributes[] = [];

    schedule.forEach((item, index) => {
      if (item.type === 'subtopic') { // Only create calendar events for subtopics
        const startDate = item.startDate;
        const endDate = new Date(startDate.getTime() + item.duration * 60000);

        events.push({
          start: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            startDate.getHours(),
            startDate.getMinutes()
          ],
          end: [
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            endDate.getDate(),
            endDate.getHours(),
            endDate.getMinutes()
          ],
          title: `Study: ${item.title}`,
          description: `${item.description}\n\nPart of: ${roadmapData.title || 'Learning Roadmap'}\nCrafted by Menttor.live`,
          location: 'Your Study Space',
          categories: ['Education', 'Learning', 'Menttor'],
          status: 'TENTATIVE',
          busyStatus: 'BUSY',
          organizer: { name: 'Menttor Learning Platform', email: 'noreply@menttor.ai' }
        });
      }
    });

    // Create ICS file content
    let icsContent = '';
    events.forEach(event => {
      const { error, value } = createEvent(event);
      if (!error && value) {
        icsContent += value;
      }
    });

    return icsContent;
    
    } catch (error) {
      console.error('Error generating calendar events:', error);
      return '';
    }
  }

  public downloadCalendar(roadmapData: RoadmapData | null | undefined): void {
    try {
      const icsContent = this.generateCalendarEvents(roadmapData);
      if (!icsContent) {
        throw new Error('Failed to generate calendar content');
      }
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fileName = (roadmapData?.title || 'roadmap').replace(/[^a-z0-9]/gi, '_');
      link.download = `${fileName}_schedule.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading calendar:', error);
      throw error;
    }
  }

  public addToGoogleCalendar(roadmapData: RoadmapData | null | undefined): void {
    try {
      if (!roadmapData) {
        throw new Error('No roadmap data provided');
      }

      const schedule = this.generateSchedule(roadmapData);
      const firstEvent = schedule.find(item => item.type === 'subtopic');
      
      if (!firstEvent) {
        console.warn('No study sessions found to add to calendar');
        return;
      }

      const startDate = firstEvent.startDate;
      const endDate = new Date(startDate.getTime() + firstEvent.duration * 60000);
      
      const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
      googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
      googleCalendarUrl.searchParams.set('text', `Study Session: ${roadmapData.title || 'Learning Roadmap'}`);
      googleCalendarUrl.searchParams.set('dates', 
        `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
      );
      googleCalendarUrl.searchParams.set('details', 
        `Learning roadmap: ${roadmapData.description || 'No description'}\n\nCrafted by Menttor.live - Your Smart Learning Companion`
      );
      googleCalendarUrl.searchParams.set('location', 'Your Study Space');
      
      window.open(googleCalendarUrl.toString(), '_blank');
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      throw error;
    }
  }
}