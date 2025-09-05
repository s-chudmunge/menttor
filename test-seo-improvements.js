#!/usr/bin/env node

/**
 * SEO Testing Script for Menttor Learning Platform
 * Tests all the indexing improvements we've implemented
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menttor.live';

// Test functions
async function testSitemap() {
  console.log('🗺️  Testing sitemap...');
  try {
    const response = await fetch(`${BASE_URL}/sitemap.xml`);
    if (response.ok) {
      const text = await response.text();
      const urlCount = (text.match(/<url>/g) || []).length;
      console.log(`✅ Sitemap loaded successfully with ${urlCount} URLs`);
      
      // Check for explore URLs
      if (text.includes('/explore/')) {
        console.log('✅ Sitemap includes explore pages');
      } else {
        console.log('⚠️  Sitemap may not include all explore pages');
      }
    } else {
      console.log(`❌ Sitemap failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Sitemap test failed: ${error.message}`);
  }
}

async function testRobots() {
  console.log('🤖 Testing robots.txt...');
  try {
    const response = await fetch(`${BASE_URL}/robots.txt`);
    if (response.ok) {
      const text = await response.text();
      console.log('✅ Robots.txt loaded successfully');
      
      if (text.includes('Allow: /explore')) {
        console.log('✅ Robots.txt allows explore pages');
      } else {
        console.log('⚠️  Robots.txt may not explicitly allow explore pages');
      }
      
      if (text.includes('Sitemap:')) {
        console.log('✅ Sitemap location specified in robots.txt');
      }
    } else {
      console.log(`❌ Robots.txt failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Robots.txt test failed: ${error.message}`);
  }
}

async function testSEOEndpoints() {
  console.log('🔍 Testing SEO endpoints...');
  
  try {
    // Test SEO health check
    const seoResponse = await fetch(`${BASE_URL}/api/seo`);
    if (seoResponse.ok) {
      const seoData = await seoResponse.json();
      console.log(`✅ SEO health check: ${seoData.seo_health} (Score: ${seoData.score})`);
    }
    
    // Test sitemap status
    const sitemapResponse = await fetch(`${BASE_URL}/api/seo?check=sitemap`);
    if (sitemapResponse.ok) {
      const sitemapData = await sitemapResponse.json();
      console.log(`✅ Sitemap status check: ${sitemapData.pages_count} pages indexed`);
      console.log(`✅ Roadmaps indexed: ${sitemapData.roadmaps_indexed || 'Dynamic count'}`);
    }
    
    // Test comprehensive roadmap data
    const roadmapResponse = await fetch(`${BASE_URL}/api/seo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get-all-roadmaps' })
    });
    
    if (roadmapResponse.ok) {
      const roadmapData = await roadmapResponse.json();
      console.log(`✅ Comprehensive roadmap discovery: ${roadmapData.stats?.totalRoadmaps || 0} roadmaps`);
      console.log(`✅ Categories: ${roadmapData.stats?.categories || 0} categories`);
    }
    
  } catch (error) {
    console.log(`❌ SEO endpoints test failed: ${error.message}`);
  }
}

async function testExplorePages() {
  console.log('📖 Testing explore pages...');
  
  try {
    // Test main explore page
    const exploreResponse = await fetch(`${BASE_URL}/explore`);
    if (exploreResponse.ok) {
      const text = await exploreResponse.text();
      console.log('✅ Main explore page loads successfully');
      
      // Check for structured data
      if (text.includes('application/ld+json')) {
        console.log('✅ Structured data present on explore page');
      }
      
      // Check for meta tags
      if (text.includes('<meta name="description"')) {
        console.log('✅ Meta description present');
      }
    }
    
    // Test a sample roadmap page (using a common slug/ID)
    const roadmapResponse = await fetch(`${BASE_URL}/explore/web-development`);
    if (roadmapResponse.ok) {
      console.log('✅ Sample roadmap page loads successfully');
    } else {
      // Try with a different common roadmap
      const altResponse = await fetch(`${BASE_URL}/explore/1`);
      if (altResponse.ok) {
        console.log('✅ Sample roadmap page (by ID) loads successfully');
      } else {
        console.log('⚠️  Could not test specific roadmap pages');
      }
    }
    
  } catch (error) {
    console.log(`❌ Explore pages test failed: ${error.message}`);
  }
}

async function testSubmissionEndpoints() {
  console.log('📤 Testing submission endpoints...');
  
  try {
    // Test sitemap submission endpoint (GET for info)
    const submissionResponse = await fetch(`${BASE_URL}/api/submit-sitemap`);
    if (submissionResponse.ok) {
      console.log('✅ Sitemap submission endpoint available');
    }
    
    // Test URL submission endpoint
    const urlResponse = await fetch(`${BASE_URL}/api/seo/submit-urls`);
    if (urlResponse.ok) {
      console.log('✅ URL submission endpoint available');
    }
    
  } catch (error) {
    console.log(`❌ Submission endpoints test failed: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting SEO Indexing Tests for Menttor Platform');
  console.log('='.repeat(60));
  
  await testSitemap();
  console.log('');
  
  await testRobots();
  console.log('');
  
  await testSEOEndpoints();
  console.log('');
  
  await testExplorePages();
  console.log('');
  
  await testSubmissionEndpoints();
  console.log('');
  
  console.log('='.repeat(60));
  console.log('✅ SEO Testing Complete!');
  console.log('');
  console.log('📋 Next Manual Steps:');
  console.log('1. Submit sitemap to Google Search Console: https://search.google.com/search-console');
  console.log('2. Request indexing for priority pages');
  console.log('3. Monitor indexing status over the next 24-48 hours');
  console.log('4. Check Google Search Console for any crawl errors');
  console.log('5. Use the "Request Indexing" feature for high-priority roadmap pages');
}

// Run tests
runAllTests().catch(console.error);