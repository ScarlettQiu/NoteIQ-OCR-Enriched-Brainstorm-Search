#app.py
from flask import Flask, request, jsonify
import base64
import os
import requests
import json
from dotenv import load_dotenv
from google.cloud import vision
import google.generativeai as genai

# Load environment variables from .env
load_dotenv()

# Get credentials from .env
service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
api_key = os.getenv("GOOGLE_API_KEY")

if not service_account_path or not api_key:
    raise ValueError("Missing GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY in .env")

# Set up Google Vision client (OCR)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = service_account_path
vision_client = vision.ImageAnnotatorClient()

# Set up Gemini client
genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel("gemini-pro")

# Flask app
app = Flask(__name__)

def search_relevant_articles(keywords, categories, max_articles=3):
    """
    Search for relevant articles based on keywords and categories using web search
    """
    try:
        # Create more targeted search query combining categories and keywords
        if categories:
            # Use category + top keywords for more relevant results
            search_query = f"{categories[0]} {' '.join(keywords[:2])}"
        else:
            # Fallback to just keywords
            search_query = " ".join(keywords[:3])
        
        print(f"Searching for: {search_query}")  # Debug output
        
        # Use DuckDuckGo Instant Answer API for search (free, no API key needed)
        search_url = "https://api.duckduckgo.com/"
        params = {
            'q': search_query,
            'format': 'json',
            'no_html': '1',
            'skip_disambig': '1'
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        data = response.json()
        
        print(f"DuckDuckGo response keys: {list(data.keys())}")  # Debug output
        
        articles = []
        
        # Extract related topics and abstracts
        if 'RelatedTopics' in data and data['RelatedTopics']:
            print(f"Found {len(data['RelatedTopics'])} related topics")  # Debug output
            for topic in data['RelatedTopics'][:max_articles]:
                if 'Text' in topic and 'FirstURL' in topic:
                    articles.append({
                        'title': topic['Text'][:100] + '...' if len(topic['Text']) > 100 else topic['Text'],
                        'url': topic['FirstURL'],
                        'source': 'DuckDuckGo'
                    })
        
        # If no related topics, try to get abstract from main result
        if not articles and 'Abstract' in data and data['Abstract']:
            print("Using abstract as fallback")  # Debug output
            articles.append({
                'title': data['Abstract'][:100] + '...' if len(data['Abstract']) > 100 else data['Abstract'],
                'url': data.get('AbstractURL', ''),
                'source': 'DuckDuckGo'
            })
        
        # If still no articles, create some generic helpful links based on categories
        if not articles:
            print("No articles found, creating generic recommendations")  # Debug output
            articles = create_generic_recommendations(categories, keywords)
        
        print(f"Returning {len(articles)} articles")  # Debug output
        return articles[:max_articles]
        
    except Exception as e:
        print(f"Article search error: {str(e)}")
        # Return generic recommendations as fallback
        return create_generic_recommendations(categories, keywords)

def create_generic_recommendations(categories, keywords):
    """
    Create generic helpful recommendations when web search fails
    """
    recommendations = []
    
    # Category-based recommendations
    if categories:
        for category in categories[:2]:  # Take first 2 categories
            if 'Problem' in category:
                recommendations.append({
                    'title': 'Problem-Solving Methodologies and Best Practices',
                    'url': 'https://en.wikipedia.org/wiki/Problem_solving',
                    'source': 'Wikipedia'
                })
            elif 'Solution' in category:
                recommendations.append({
                    'title': 'Solution Development Frameworks and Strategies',
                    'url': 'https://en.wikipedia.org/wiki/Systems_thinking',
                    'source': 'Wikipedia'
                })
            elif 'Action' in category:
                recommendations.append({
                    'title': 'Action Planning and Implementation Techniques',
                    'url': 'https://en.wikipedia.org/wiki/Project_management',
                    'source': 'Wikipedia'
                })
            elif 'Goal' in category:
                recommendations.append({
                    'title': 'Goal Setting and Achievement Strategies',
                    'url': 'https://en.wikipedia.org/wiki/Goal_setting',
                    'source': 'Wikipedia'
                })
    
    # Keyword-based recommendations
    if keywords:
        top_keyword = keywords[0] if keywords else 'general'
        recommendations.append({
            'title': f'Advanced {top_keyword.title()} Techniques and Applications',
            'url': f'https://en.wikipedia.org/wiki/{top_keyword.replace(" ", "_")}',
            'source': 'Wikipedia'
        })
    
    return recommendations[:3]  # Return max 3 recommendations

def extract_sentences(text):
    """
    Extract sentences from text with proper sentence boundary detection
    """
    import re
    
    # Clean the text first
    text = text.strip()
    
    # Split by sentence endings, but be careful with abbreviations
    sentence_endings = r'[.!?]+'
    sentences = re.split(sentence_endings, text)
    
    # Clean up sentences
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # If no sentences found, try splitting by line breaks
    if not sentences:
        sentences = [line.strip() for line in text.split('\n') if line.strip()]
    
    # If still no sentences, treat the whole text as one sentence
    if not sentences:
        sentences = [text]
    
    return sentences

def identify_key_sentences(sentences):
    """
    Identify the most important sentences based on content analysis
    """
    if not sentences:
        return []
    
    # Score sentences based on various factors
    scored_sentences = []
    
    for sentence in sentences:
        score = 0
        sentence_lower = sentence.lower()
        
        # Length factor (longer sentences often contain more information)
        if len(sentence.split()) > 5:
            score += 1
        
        # Question sentences (often indicate important points)
        if sentence.strip().endswith('?'):
            score += 2
        
        # Action words
        action_words = ['implement', 'create', 'develop', 'build', 'design', 'solve', 'improve', 'optimize', 'achieve', 'accomplish']
        if any(word in sentence_lower for word in action_words):
            score += 2
        
        # Problem/solution indicators
        problem_words = ['problem', 'issue', 'challenge', 'difficulty', 'obstacle', 'barrier']
        solution_words = ['solution', 'fix', 'resolve', 'improve', 'enhance', 'optimize']
        
        if any(word in sentence_lower for word in problem_words):
            score += 2
        if any(word in sentence_lower for word in solution_words):
            score += 2
        
        # Goal/objective indicators
        goal_words = ['goal', 'objective', 'target', 'aim', 'purpose', 'mission', 'vision']
        if any(word in sentence_lower for word in goal_words):
            score += 2
        
        # Technical terms (often important)
        if any(char.isdigit() for char in sentence):  # Contains numbers
            score += 1
        
        # Capitalized words (proper nouns, important concepts)
        capitalized_words = [word for word in sentence.split() if word[0].isupper() and len(word) > 2]
        score += len(capitalized_words) * 0.5
        
        scored_sentences.append((sentence, score))
    
    # Sort by score and return top sentences
    scored_sentences.sort(key=lambda x: x[1], reverse=True)
    
    # Return top 3 sentences, but only if they have a score > 0
    key_sentences = [sentence for sentence, score in scored_sentences[:3] if score > 0]
    
    return key_sentences

def extract_visual_elements(objects_response, labels_response, faces_response, 
                          landmarks_response, logos_response, safe_search_response, web_response):
    """
    Extract and analyze visual elements from Google Vision API responses
    """
    visual_analysis = {
        "objects": [],
        "labels": [],
        "faces": [],
        "landmarks": [],
        "logos": [],
        "shapes": [],
        "colors": [],
        "mood": "neutral",
        "content_type": "mixed",
        "visual_summary": ""
    }
    
    try:
        # Extract objects (shapes, items, etc.)
        if objects_response.localized_object_annotations:
            for obj in objects_response.localized_object_annotations:
                visual_analysis["objects"].append({
                    "name": obj.name,
                    "confidence": obj.score,
                    "bounding_box": {
                        "x": obj.bounding_poly.normalized_vertices[0].x if obj.bounding_poly.normalized_vertices else 0,
                        "y": obj.bounding_poly.normalized_vertices[0].y if obj.bounding_poly.normalized_vertices else 0,
                        "width": obj.bounding_poly.normalized_vertices[2].x - obj.bounding_poly.normalized_vertices[0].x if len(obj.bounding_poly.normalized_vertices) > 2 else 0,
                        "height": obj.bounding_poly.normalized_vertices[2].y - obj.bounding_poly.normalized_vertices[0].y if len(obj.bounding_poly.normalized_vertices) > 2 else 0
                    }
                })
        
        # Extract labels (concepts, themes)
        if labels_response.label_annotations:
            for label in labels_response.label_annotations:
                visual_analysis["labels"].append({
                    "description": label.description,
                    "confidence": label.score
                })
        
        # Extract faces and emotions
        if faces_response.face_annotations:
            emotions = []
            for face in faces_response.face_annotations:
                emotion_data = {
                    "joy": face.joy_likelihood,
                    "sorrow": face.sorrow_likelihood,
                    "anger": face.anger_likelihood,
                    "surprise": face.surprise_likelihood
                }
                emotions.append(emotion_data)
                visual_analysis["faces"].append(emotion_data)
            
            # Determine overall mood
            if emotions:
                avg_joy = sum(e["joy"] for e in emotions) / len(emotions)
                if avg_joy > 3:  # LIKELY or VERY_LIKELY
                    visual_analysis["mood"] = "positive"
                elif any(e["sorrow"] > 3 or e["anger"] > 3 for e in emotions):
                    visual_analysis["mood"] = "negative"
                else:
                    visual_analysis["mood"] = "neutral"
        
        # Extract landmarks
        if landmarks_response.landmark_annotations:
            for landmark in landmarks_response.landmark_annotations:
                visual_analysis["landmarks"].append({
                    "description": landmark.description,
                    "confidence": landmark.score
                })
        
        # Extract logos
        if logos_response.logo_annotations:
            for logo in logos_response.logo_annotations:
                visual_analysis["logos"].append({
                    "description": logo.description,
                    "confidence": logo.score
                })
        
        # Analyze shapes from objects
        shape_keywords = ['circle', 'square', 'rectangle', 'triangle', 'line', 'arrow', 'diamond', 'oval', 'polygon']
        for obj in visual_analysis["objects"]:
            if any(shape in obj["name"].lower() for shape in shape_keywords):
                visual_analysis["shapes"].append(obj["name"])
        
        # Determine content type
        if visual_analysis["objects"] and not visual_analysis["labels"]:
            visual_analysis["content_type"] = "diagram"
        elif visual_analysis["faces"]:
            visual_analysis["content_type"] = "portrait"
        elif visual_analysis["landmarks"]:
            visual_analysis["content_type"] = "location"
        elif visual_analysis["logos"]:
            visual_analysis["content_type"] = "brand"
        elif visual_analysis["labels"]:
            visual_analysis["content_type"] = "scene"
        
        # Create visual summary
        summary_parts = []
        if visual_analysis["objects"]:
            summary_parts.append(f"Contains {len(visual_analysis['objects'])} objects: {', '.join([obj['name'] for obj in visual_analysis['objects'][:3]])}")
        if visual_analysis["shapes"]:
            summary_parts.append(f"Geometric shapes: {', '.join(visual_analysis['shapes'])}")
        if visual_analysis["labels"]:
            summary_parts.append(f"Key themes: {', '.join([label['description'] for label in visual_analysis['labels'][:3]])}")
        if visual_analysis["mood"] != "neutral":
            summary_parts.append(f"Mood: {visual_analysis['mood']}")
        
        visual_analysis["visual_summary"] = ". ".join(summary_parts) if summary_parts else "Visual content detected"
        
    except Exception as e:
        print(f"Visual analysis error: {str(e)}")
        visual_analysis["visual_summary"] = "Visual analysis unavailable"
    
    return visual_analysis

def create_enhanced_analysis(text, visual_analysis=None):
    """
    Create enhanced analysis when Gemini API is not available
    """
    # Extract sentences and analyze them
    sentences = extract_sentences(text)
    key_sentences = identify_key_sentences(sentences)
    
    words = text.split()
    word_count = len(words)
    
    # Extract meaningful keywords
    common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
    keywords = [word.lower().strip('.,!?;:"()[]{}') for word in words if len(word) > 2 and word.lower().strip('.,!?;:"()[]{}') not in common_words]
    unique_keywords = list(set(keywords))
    
    # Analyze text patterns
    lines = text.split('\n')
    non_empty_lines = [line.strip() for line in lines if line.strip()]
    
    # Detect categories with more sophisticated analysis
    categories = []
    if any(word in text.lower() for word in ['problem', 'issue', 'challenge', 'difficulty', 'trouble', 'obstacle', 'barrier']):
        categories.append('Problem Identification')
    if any(word in text.lower() for word in ['solution', 'fix', 'improve', 'better', 'optimize', 'enhance', 'resolve']):
        categories.append('Solution Development')
    if any(word in text.lower() for word in ['idea', 'concept', 'brainstorm', 'think', 'consider', 'innovation', 'creative']):
        categories.append('Ideation')
    if any(word in text.lower() for word in ['action', 'do', 'implement', 'execute', 'start', 'begin', 'launch']):
        categories.append('Action Items')
    if any(word in text.lower() for word in ['goal', 'objective', 'target', 'aim', 'purpose', 'mission', 'vision']):
        categories.append('Goal Setting')
    
    # Create key sentences text
    if key_sentences:
        key_sentences_text = "\n".join([f"• \"{sentence}\"" for sentence in key_sentences[:3]])
    else:
        key_sentences_text = "• No key sentences identified"
    
    # Create visual analysis section
    visual_section = ""
    if visual_analysis:
        visual_section = f"""

**👁️ Visual Analysis:**
• **Content Type**: {visual_analysis.get('content_type', 'unknown').title()}
• **Objects Detected**: {', '.join([obj['name'] for obj in visual_analysis.get('objects', [])[:5]]) if visual_analysis.get('objects') else 'None detected'}
• **Shapes**: {', '.join(visual_analysis.get('shapes', [])) if visual_analysis.get('shapes') else 'No geometric shapes'}
• **Key Themes**: {', '.join([label['description'] for label in visual_analysis.get('labels', [])[:5]]) if visual_analysis.get('labels') else 'No themes detected'}
• **Mood**: {visual_analysis.get('mood', 'neutral').title()}
• **Visual Summary**: {visual_analysis.get('visual_summary', 'No visual analysis available')}
"""
    
    # Create more insightful analysis with sentence-based insights
    return f"""
📝 **NoteIQ Enhanced Analysis**

**🎯 Key Themes & Patterns:**
{', '.join(categories) if categories else 'General Content Analysis'}

**📝 Key Sentences Identified:**
{key_sentences_text}
{visual_section}

**🔍 Strategic Insights:**
• **Content Focus**: {'Problem-solving oriented' if 'Problem' in str(categories) else 'Solution-focused' if 'Solution' in str(categories) else 'Ideation-driven' if 'Ideation' in str(categories) else 'Action-oriented' if 'Action' in str(categories) else 'Goal-directed' if 'Goal' in str(categories) else 'General brainstorming'}
• **Complexity Level**: {'High complexity' if word_count > 100 else 'Medium complexity' if word_count > 50 else 'Simple concepts'}
• **Structure**: {len(sentences)} sentences with {len(key_sentences)} key insights
• **Sentence Analysis**: {len(non_empty_lines)} distinct ideas with {len(unique_keywords)} unique concepts

**💡 Actionable Recommendations:**
1. **Immediate Focus**: Prioritize {categories[0].lower() if categories else 'key concepts'} development
2. **Key Areas**: Deep dive into {', '.join(unique_keywords[:3]) if unique_keywords else 'main topics'}
3. **Next Phase**: {'Expand on solutions' if 'Problem' in str(categories) else 'Implement ideas' if 'Ideation' in str(categories) else 'Execute actions' if 'Action' in str(categories) else 'Refine goals' if 'Goal' in str(categories) else 'Develop strategies'}

**🚀 Strategic Next Steps:**
- **Short-term**: Focus on {unique_keywords[0] if unique_keywords else 'primary concepts'} implementation
- **Medium-term**: Develop comprehensive {categories[0].lower() if categories else 'strategic'} framework
- **Long-term**: Create sustainable {', '.join(unique_keywords[:2]) if unique_keywords else 'solution'} ecosystem

**🔧 Analysis Source:**
- Enhanced sentence-based analysis with computer vision (Gemini API temporarily unavailable)
- For advanced AI insights, please check your API configuration
- Ready for further processing once AI services are restored
    """

@app.route("/ocr", methods=["POST"])
def ocr_handwriting():
    """
    Accepts base64 image and returns extracted text, shapes, and visual analysis
    """
    data = request.json
    img_base64 = data.get("image_base64")
    
    if not img_base64:
        return jsonify({"error": "No image provided"}), 400
    
    image_content = base64.b64decode(img_base64)
    image = vision.Image(content=image_content)
    
    try:
        # Perform multiple vision API calls in parallel
        import concurrent.futures
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Submit all vision tasks
            text_future = executor.submit(vision_client.document_text_detection, image=image)
            objects_future = executor.submit(vision_client.object_localization, image=image)
            labels_future = executor.submit(vision_client.label_detection, image=image)
            faces_future = executor.submit(vision_client.face_detection, image=image)
            landmarks_future = executor.submit(vision_client.landmark_detection, image=image)
            logos_future = executor.submit(vision_client.logo_detection, image=image)
            safe_search_future = executor.submit(vision_client.safe_search_detection, image=image)
            web_future = executor.submit(vision_client.web_detection, image=image)
            
            # Get results
            text_response = text_future.result()
            objects_response = objects_future.result()
            labels_response = labels_future.result()
            faces_response = faces_future.result()
            landmarks_response = landmarks_future.result()
            logos_response = logos_future.result()
            safe_search_response = safe_search_future.result()
            web_response = web_future.result()
        
        # Extract text
        text = text_response.full_text_annotation.text if text_response.full_text_annotation else ""
        
        # Extract visual elements
        visual_analysis = extract_visual_elements(
            objects_response, labels_response, faces_response, 
            landmarks_response, logos_response, safe_search_response, web_response
        )
        
        return jsonify({
            "extracted_text": text,
            "visual_analysis": visual_analysis
        })
        
    except Exception as e:
        return jsonify({"error": f"Vision processing failed: {str(e)}"}), 500

@app.route("/enrich", methods=["POST"])
def enrich_text():
    """
    Accepts text and visual analysis, returns enriched summary and insights
    """
    data = request.json
    text = data.get("text")
    visual_analysis = data.get("visual_analysis", {})
    
    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Try Gemini API first, fallback to enhanced analysis
    try:
        # Attempt to use Gemini API for intelligent analysis
        try:
            # Create visual context for the prompt
            visual_context = ""
            if visual_analysis:
                visual_context = f"""

Visual Analysis:
- Content Type: {visual_analysis.get('content_type', 'unknown')}
- Objects Detected: {', '.join([obj['name'] for obj in visual_analysis.get('objects', [])[:5]])}
- Shapes: {', '.join(visual_analysis.get('shapes', []))}
- Key Themes: {', '.join([label['description'] for label in visual_analysis.get('labels', [])[:5]])}
- Mood: {visual_analysis.get('mood', 'neutral')}
- Visual Summary: {visual_analysis.get('visual_summary', 'No visual analysis available')}
"""
            
            prompt = f"""
Analyze the following text and visual content to provide deep, actionable insights:

Text: "{text}"
{visual_context}

Please provide:
1. **Key Themes & Patterns**: What are the main themes and underlying patterns in both text and visuals?
2. **Strategic Insights**: What strategic implications can you identify from the combined content?
3. **Visual-Text Connections**: How do the visual elements relate to and enhance the text content?
4. **Actionable Recommendations**: What specific actions should be taken based on both text and visual analysis?
5. **Potential Challenges**: What obstacles or challenges might arise from the content?
6. **Opportunities**: What opportunities can be leveraged from the visual and textual elements?
7. **Next Steps**: What are the most important next steps to take?

Format your response as a comprehensive analysis with clear sections and actionable insights that consider both textual and visual elements.
"""

            response = gemini_model.generate_content(prompt)
            enriched = f"""
📝 **NoteIQ AI-Powered Analysis**

{response.text}

**🔧 Analysis Source:**
- Powered by Google Gemini AI
- Advanced natural language processing
- Contextual understanding and strategic insights
            """
            
        except Exception as gemini_error:
            print(f"Gemini API error: {str(gemini_error)}")
            # Fallback to enhanced analysis with visual elements
            enriched = create_enhanced_analysis(text, visual_analysis)
        
        # Extract sentences and analyze them
        sentences = extract_sentences(text)
        key_sentences = identify_key_sentences(sentences)
        
        # Search for relevant articles
        words = text.split()
        common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'a', 'an', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}
        keywords = [word.lower().strip('.,!?;:"()[]{}') for word in words if len(word) > 2 and word.lower().strip('.,!?;:"()[]{}') not in common_words]
        unique_keywords = list(set(keywords))
        
        # Detect categories
        categories = []
        if any(word in text.lower() for word in ['problem', 'issue', 'challenge', 'difficulty', 'trouble']):
            categories.append('Problem Identification')
        if any(word in text.lower() for word in ['solution', 'fix', 'improve', 'better', 'optimize']):
            categories.append('Solution Development')
        if any(word in text.lower() for word in ['idea', 'concept', 'brainstorm', 'think', 'consider']):
            categories.append('Ideation')
        if any(word in text.lower() for word in ['action', 'do', 'implement', 'execute', 'start']):
            categories.append('Action Items')
        if any(word in text.lower() for word in ['goal', 'objective', 'target', 'aim', 'purpose']):
            categories.append('Goal Setting')
        
        articles = search_relevant_articles(unique_keywords, categories, max_articles=3)
        
        # Add recommended reading section
        if articles:
            reading_section = f"""

**📚 Recommended Reading:**
{chr(10).join([f"• [{article['title']}]({article['url']})" for article in articles])}

**💡 Reading Focus:**
{'- Deep dive into ' + categories[0].lower() + ' strategies and best practices' if categories else '- Explore advanced techniques for your key concepts'}
{'- Learn more about ' + ', '.join(unique_keywords[:2]) + ' implementation' if unique_keywords else '- Discover related methodologies and frameworks'}
            """
            enriched += reading_section

        return jsonify({
            "original_text": text,
            "enriched_output": enriched
        })
    except Exception as e:
        return jsonify({"error": f"Content enrichment failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)