#!/usr/bin/env python3
"""
Test script to verify all AI service endpoints are working
Run this to test roadmap, quiz, learning content, and other AI features
"""

import sys
import os
import json

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

import asyncio
from services.ai_service import (
    generate_roadmap_content,
    generate_learning_content,
    generate_learning_resources
)
from schemas import (
    RoadmapCreateRequest,
    LearningContentRequest,
    GenerateResourcesRequest
)


async def test_roadmap_generation():
    """Test roadmap generation"""
    print("\n" + "="*60)
    print("1. Testing Roadmap Generation")
    print("="*60)

    try:
        request = RoadmapCreateRequest(
            subject="Python Programming",
            goal="Learn Python basics",
            time_value=2,
            time_unit="weeks",
            model=None  # Will use default model
        )

        print(f"📤 Generating roadmap for: {request.subject}")
        print(f"   Goal: {request.goal}")
        print(f"   Timeline: {request.time_value} {request.time_unit}")

        result = await generate_roadmap_content(request)

        print(f"✅ SUCCESS: Roadmap generated")
        print(f"   Title: {result.title}")
        print(f"   Description: {result.description[:100]}...")
        print(f"   Model used: {result.model}")
        print(f"   Modules: {len(result.roadmap_plan.modules) if result.roadmap_plan else 0}")

        return True
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {str(e)}")
        return False


async def test_learning_content_generation():
    """Test learning content generation"""
    print("\n" + "="*60)
    print("3. Testing Learning Content Generation")
    print("="*60)

    try:
        request = LearningContentRequest(
            subject="Python Programming",
            goal="Learn Python basics",
            module="Introduction to Python",
            topic="Variables and Data Types",
            subtopic="Python Variables",
            model=None  # Will use default model
        )

        print(f"📤 Generating learning content for: {request.subtopic}")
        print(f"   Subject: {request.subject}")

        result = await generate_learning_content(request)

        print(f"✅ SUCCESS: Learning content generated")
        print(f"   Content blocks: {len(result.content)}")
        print(f"   Model used: {result.model}")

        # Show content types
        content_types = [block.type for block in result.content]
        unique_types = list(set(content_types))
        print(f"   Content types: {', '.join(unique_types)}")

        return True
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {str(e)}")
        return False


async def test_learning_resources_generation():
    """Test learning resources generation"""
    print("\n" + "="*60)
    print("4. Testing Learning Resources Generation")
    print("="*60)

    try:
        request = GenerateResourcesRequest(
            roadmap_id=0,  # Dummy ID for testing
            subject="Python Programming",
            goal="Learn Python basics",
            roadmap_plan={
                "modules": [
                    {
                        "module_title": "Introduction to Python",
                        "topics": [
                            {
                                "topic_title": "Variables and Data Types",
                                "subtopics": ["Python Variables", "Data Types"]
                            }
                        ]
                    }
                ]
            }
        )

        print(f"📤 Generating learning resources")
        print(f"   Subject: {request.subject}")

        result = await generate_learning_resources(request)

        print(f"✅ SUCCESS: Learning resources generated")
        print(f"   Resources: {len(result.resources)}")
        print(f"   Model used: {result.model}")

        # Show first resource
        if result.resources:
            r = result.resources[0]
            print(f"   Sample resource: {r.title}")
            print(f"   Type: {r.type}")

        return True
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {str(e)}")
        return False


async def test_all_endpoints():
    """Run all tests"""
    print("\n" + "🚀"*30)
    print("MENTTOR AI SERVICES TEST")
    print("🚀"*30)

    results = {}

    # Test all endpoints
    results['roadmap'] = await test_roadmap_generation()
    results['learning_content'] = await test_learning_content_generation()
    results['learning_resources'] = await test_learning_resources_generation()

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    for service, status in results.items():
        icon = "✅" if status else "❌"
        print(f"{icon} {service.replace('_', ' ').title()}: {'PASS' if status else 'FAIL'}")

    print(f"\n📊 Results: {passed}/{total} passed, {failed}/{total} failed")

    if failed > 0:
        print("\n⚠️  Some tests failed. Check your:")
        print("   - GEMINI_API_KEY environment variable")
        print("   - Default model configurations in config.py")
        print("   - Network connectivity to AI service providers")
        return False
    else:
        print("\n🎉 All AI services are working correctly!")
        return True


if __name__ == "__main__":
    try:
        success = asyncio.run(test_all_endpoints())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
