#!/bin/bash

# Auto Batch Generator Script
# Continuously runs subtopic generation in batches until completion

API_URL="https://menttor-backend-144050828172.asia-south1.run.app/subtopic-generator"
BATCH_SIZE=20
MAX_BATCHES=1000  # Safety limit
SLEEP_BETWEEN_BATCHES=10  # seconds

echo "🚀 Starting Auto Batch Generator"
echo "API URL: $API_URL"
echo "Batch Size: $BATCH_SIZE"
echo "==============================================="

for batch_num in $(seq 1 $MAX_BATCHES); do
    echo "🔄 Starting Batch #$batch_num at $(date)"
    
    # Check current status
    status_response=$(curl -s "$API_URL/batch-status")
    echo "📊 Current Status: $status_response"
    
    # Extract if generator is running
    running=$(echo "$status_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('running', False))")
    
    if [ "$running" = "True" ]; then
        echo "⏳ Generator already running, waiting..."
        sleep 30
        continue
    fi
    
    # Extract next batch start position
    next_start=$(echo "$status_response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    message = data.get('message', '')
    if 'Next batch can start from' in message:
        start_pos = message.split('from ')[-1]
        print(start_pos)
    else:
        print('0')
except:
    print('0')
")
    
    echo "📍 Starting from position: $next_start"
    
    # Start next batch
    start_response=$(curl -s -X POST "$API_URL/start-batch?batch_size=$BATCH_SIZE&start_from=$next_start")
    echo "🎯 Batch Start Response: $start_response"
    
    # Check if batch started successfully
    success=$(echo "$start_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('success', False))")
    
    if [ "$success" != "True" ]; then
        echo "❌ Failed to start batch #$batch_num"
        echo "Response: $start_response"
        sleep 60  # Wait longer on failure
        continue
    fi
    
    echo "✅ Batch #$batch_num started successfully"
    
    # Wait for batch to complete
    echo "⏳ Waiting for batch to complete..."
    while true; do
        sleep 15
        current_status=$(curl -s "$API_URL/batch-status")
        still_running=$(echo "$current_status" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('running', False))")
        
        if [ "$still_running" != "True" ]; then
            echo "✅ Batch #$batch_num completed!"
            echo "📊 Final Status: $current_status"
            
            # Check if we're done (no more batches)
            message=$(echo "$current_status" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('message', ''))")
            if [[ "$message" == *"All batches completed"* ]] || [[ "$message" == *"All subtopics completed"* ]]; then
                echo "🎉 ALL SUBTOPICS COMPLETED! Generation finished!"
                exit 0
            fi
            break
        fi
        
        echo "⏳ Batch #$batch_num still running..."
    done
    
    echo "💤 Sleeping $SLEEP_BETWEEN_BATCHES seconds before next batch..."
    sleep $SLEEP_BETWEEN_BATCHES
done

echo "⚠️ Reached maximum batch limit ($MAX_BATCHES). Stopping."