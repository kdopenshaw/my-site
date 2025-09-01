---
title: "Titanic Dataset Machine Learning Analysis"
description: "A comprehensive machine learning analysis of the Titanic dataset using Python, pandas, and scikit-learn, including data preprocessing, model training, and visualization."
image: "/julia_0.2841_notext.png"
year: "2024"
pages: "6"
category: "Data Science"
contentType: "html"
---

<div id="71728f7e" class="cell" data-execution_count="1">
<div class="sourceCode cell-code" id="cb1"><pre class="sourceCode python code-with-copy"><code class="sourceCode python"><span id="cb1-1"><a href="#cb1-1" aria-hidden="true" tabindex="-1"></a><span class="im">import</span> pandas <span class="im">as</span> pd</span>
<span id="cb1-2"><a href="#cb1-2" aria-hidden="true" tabindex="-1"></a><span class="im">import</span> openml</span></code><button title="Copy to Clipboard" class="code-copy-button"><i class="bi"></i></button></pre></div>
</div>
<div id="9bf3c535" class="cell" data-execution_count="2">
<div class="sourceCode cell-code" id="cb2"><pre class="sourceCode python code-with-copy"><code class="sourceCode python"><span id="cb2-1"><a href="#cb2-1" aria-hidden="true" tabindex="-1"></a>titanic <span class="op">=</span> openml.datasets.get_dataset(<span class="dv">40945</span>)</span>
<span id="cb2-2"><a href="#cb2-2" aria-hidden="true" tabindex="-1"></a>X, y, cols, cats <span class="op">=</span> titanic.get_data(</span>
<span id="cb2-3"><a href="#cb2-3" aria-hidden="true" tabindex="-1"></a>    target<span class="op">=</span>titanic.default_target_attribute,</span>
<span id="cb2-4"><a href="#cb2-4" aria-hidden="true" tabindex="-1"></a>    dataset_format<span class="op">=</span><span class="st">"dataframe"</span></span>
<span id="cb2-5"><a href="#cb2-5" aria-hidden="true" tabindex="-1"></a>)</span>
<span id="cb2-6"><a href="#cb2-6" aria-hidden="true" tabindex="-1"></a></span>
<span id="cb2-7"><a href="#cb2-7" aria-hidden="true" tabindex="-1"></a><span class="bu">print</span>(<span class="st">"Shape of X:"</span>, X.shape)</span>
<span id="cb2-8"><a href="#cb2-8" aria-hidden="true" tabindex="-1"></a><span class="bu">print</span>(<span class="st">"Length of y:"</span>, <span class="bu">len</span>(y))</span>
<span id="cb2-9"><a href="#cb2-9" aria-hidden="true" tabindex="-1"></a><span class="bu">print</span>(<span class="st">"Target column:"</span>, titanic.default_target_attribute)</span>
<span id="cb2-10"><a href="#cb2-10" aria-hidden="true" tabindex="-1"></a><span class="bu">print</span>(<span class="st">"First few rows:</span><span class="ch">\n</span><span class="st">"</span>, X.head())</span></code><button title="Copy to Clipboard" class="code-copy-button"><i class="bi"></i></button></pre></div>
<div class="cell-output cell-output-stdout">
<pre><code>Shape of X: (1309, 13)
Length of y: 1309
Target column: survived
First few rows:
    pclass                                             name     sex      age  \
0       1                    Allen, Miss. Elisabeth Walton  female  29.0000   
1       1                   Allison, Master. Hudson Trevor    male   0.9167   
2       1                     Allison, Miss. Helen Loraine  female   2.0000   
3       1             Allison, Mr. Hudson Joshua Creighton    male  30.0000   
4       1  Allison, Mrs. Hudson J C (Bessie Waldo Daniels)  female  25.0000   

   sibsp  parch  ticket      fare    cabin embarked  boat   body  \
0      0      0   24160  211.3375       B5        S     2    NaN   
1      1      2  113781  151.5500  C22 C26        S    11    NaN   
2      1      2  113781  151.5500  C22 C26        S  None    NaN   
3      1      2  113781  151.5500  C22 C26        S  None  135.0   
4      1      2  113781  151.5500  C22 C26        S  None    NaN   

                         home.dest  
0                     St Louis, MO  
1  Montreal, PQ / Chesterville, ON  
2  Montreal, PQ / Chesterville, ON  
3  Montreal, PQ / Chesterville, ON  
4  Montreal, PQ / Chesterville, ON  </code></pre>
</div>
</div>
<div id="8cb9b384" class="cell" data-execution_count="3">
<div class="sourceCode cell-code" id="cb4"><pre class="sourceCode python code-with-copy"><code class="sourceCode python"><span id="cb4-1"><a href="#cb4-1" aria-hidden="true" tabindex="-1"></a><span class="co"># Fill missing numerics with median</span></span>
<span id="cb4-2"><a href="#cb4-2" aria-hidden="true" tabindex="-1"></a><span class="cf">for</span> col <span class="kw">in</span> X.select_dtypes(include<span class="op">=</span><span class="st">"number"</span>):</span>
<span id="cb4-3"><a href="#cb4-3" aria-hidden="true" tabindex="-1"></a>    X[col] <span class="op">=</span> X[col].fillna(X[col].median())</span>
<span id="cb4-4"><a href="#cb4-4" aria-hidden="true" tabindex="-1"></a></span>
<span id="cb4-5"><a href="#cb4-5" aria-hidden="true" tabindex="-1"></a><span class="co"># Fill missing categoricals with mode</span></span>
<span id="cb4-6"><a href="#cb4-6" aria-hidden="true" tabindex="-1"></a><span class="cf">for</span> col <span class="kw">in</span> X.select_dtypes(include<span class="op">=</span><span class="st">"object"</span>):</span>
<span id="cb4-7"><a href="#cb4-7" aria-hidden="true" tabindex="-1"></a>    X[col] <span class="op">=</span> X[col].fillna(X[col].mode()[<span class="dv">0</span>])</span></code><button title="Copy to Clipboard" class="code-copy-button"><i class="bi"></i></button></pre></div>
</div>
<div id="fd6000af" class="cell" data-execution_count="4">
<div class="sourceCode cell-code" id="cb5"><pre class="sourceCode python code-with-copy"><code class="sourceCode python"><span id="cb5-1"><a href="#cb5-1" aria-hidden="true" tabindex="-1"></a>X <span class="op">=</span> pd.get_dummies(X, drop_first<span class="op">=</span><span class="va">True</span>)</span></code><button title="Copy to Clipboard" class="code-copy-button"><i class="bi"></i></button></pre></div>
</div>
<div id="c85eef3a" class="cell" data-execution_count="5">
<div class="sourceCode cell-code" id="cb6"><pre class="sourceCode python code-with-copy"><code class="sourceCode python"><span id="cb6-1"><a href="#cb6-1" aria-hidden="true" tabindex="-1"></a><span class="im">from</span> sklearn.model_selection <span class="im">import</span> train_test_split</span>
<span id="cb6-2"><a href="#cb6-2" aria-hidden="true" tabindex="-1"></a></span>
<span id="cb6-3"><a href="#cb6-3" aria-hidden="true" tabindex="-1"></a>X_train, X_test, y_train, y_test <span class="op">=</span> train_test_split(</span>
<span id="cb6-4"><a href="#cb6-4" aria-hidden="true" tabindex="-1"></a>    X, y, test_size<span class="op">=</span><span class="fl">0.2</span>, random_state<span class="op">=</span><span class="dv">42</span></span>
<span id="cb6-5"><a href="#cb6-5" aria-hidden="true" tabindex="-1"></a>)</span>
<span id="cb6-6"><a href="#cb6-6" aria-hidden="true" tabindex="-1"></a></span>
<span id="cb6-7"><a href="#cb6-7" aria-hidden="true" tabindex="-1"></a><span class="bu">print</span>(<span class="st">"Train:"</span>, X_train.shape, <span class="st">"Test:"</span>, X_test.shape)</span></code><button title="Copy to Clipboard" class="code-copy-button"><i class="bi"></i></button></pre></div>
<div class="cell-output cell-output-stdout">
<pre><code>Train: (1047, 2822) Test: (262, 2822)</code></pre>
</div>
</div>
<div id="0b2be802" class="cell" data-execution_count="6">
<div class="sourceCode cell-code" id="cb8"><pre class="sourceCode python code-with-copy"><code class="sourceCode python"><span id="cb8-1"><a href="#cb8-1" aria-hidden="true" tabindex="-1"></a><span class="im">from</span> sklearn.tree <span class="im">import</span> DecisionTreeClassifier</span>
<span id="cb8-2"><a href="#cb8-2" aria-hidden="true" tabindex="-1"></a><span class="im">from</span> sklearn.metrics <span class="im">import</span> accuracy_score</span>
<span id="cb8-3"><a href="#cb8-3" aria-hidden="true" tabindex="-1"></a></span>
<span id="cb8-4"><a href="#cb8-4" aria-hidden="true" tabindex="-1"></a>clf <span class="op">=</span> DecisionTreeClassifier(max_depth<span class="op">=</span><span class="dv">3</span>, random_state<span class="op">=</span><span class="dv">42</span>)</span>
<span id="cb8-5"><a href="#cb8-5" aria-hidden="true" tabindex="-1"></a>clf.fit(X_train, y_train)</span>
<span id="cb8-6"><a href="#cb8-6" aria-hidden="true" tabindex="-1"></a></span>
<span id="cb8-7"><a href="#cb8-7" aria-hidden="true" tabindex="-1"></a>y_pred <span class="op">=</span> clf.predict(X_test)</span>
<span id="cb8-8"><a href="#cb8-8" aria-hidden="true" tabindex="-1"></a><span class="bu">print</span>(<span class="st">"Accuracy:"</span>, accuracy_score(y_test, y_pred))</span></code><button title="Copy to Clipboard" class="code-copy-button"><i class="bi"></i></button></pre></div>
<div class="cell-output cell-output-stdout">
<pre><code>Accuracy: 0.9541984732824428</code></pre>
</div>
</div>
<div id="ac4e9726" class="cell" data-execution_count="7">
<div class="sourceCode cell-code" id="cb10"><pre class="sourceCode python code-with-copy"><code class="sourceCode python"><span id="cb10-1"><a href="#cb10-1" aria-hidden="true" tabindex="-1"></a><span class="im">import</span> matplotlib.pyplot <span class="im">as</span> plt</span>
<span id="cb10-2"><a href="#cb10-2" aria-hidden="true" tabindex="-1"></a><span class="im">from</span> sklearn <span class="im">import</span> tree</span>
<span id="cb10-3"><a href="#cb10-3" aria-hidden="true" tabindex="-1"></a></span>
<span id="cb10-4"><a href="#cb10-4" aria-hidden="true" tabindex="-1"></a>plt.figure(figsize<span class="op">=</span>(<span class="dv">12</span>,<span class="dv">6</span>))</span>
<span id="cb10-5"><a href="#cb10-5" aria-hidden="true" tabindex="-1"></a>tree.plot_tree(clf, feature_names<span class="op">=</span>X.columns, class_names<span class="op">=</span>clf.classes_.astype(<span class="bu">str</span>), filled<span class="op">=</span><span class="va">True</span>)</span>
<span id="cb10-6"><a href="#cb10-6" aria-hidden="true" tabindex="-1"></a>plt.show()</span></code><button title="Copy to Clipboard" class="code-copy-button"><i class="bi"></i></button></pre></div>
<div class="cell-output cell-output-display">
<div>
<figure class="figure">
<p><img src="Untitled_files/figure-html/cell-8-output-1.png" width="912" height="463" class="figure-img"></p>
</figure>
</div>
</div>
</div>

<style>
code{white-space: pre-wrap;}
span.smallcaps{font-variant: small-caps;}
div.columns{display: flex; gap: min(4vw, 1.5em);}
div.column{flex: auto; overflow-x: auto;}
div.hanging-indent{margin-left: 1.5em; text-indent: -1.5em;}
ul.task-list{list-style: none;}
ul.task-list li input[type="checkbox"] {
  width: 0.8em;
  margin: 0 0.8em 0.2em -1em;
  vertical-align: middle;
}
/* CSS for syntax highlighting */
html { -webkit-text-size-adjust: 100%; }
pre > code.sourceCode { white-space: pre; position: relative; }
pre > code.sourceCode > span { display: inline-block; line-height: 1.25; }
pre > code.sourceCode > span:empty { height: 1.2em; }
.sourceCode { overflow: visible; }
code.sourceCode > span { color: inherit; text-decoration: inherit; }
div.sourceCode { margin: 1em 0; }
pre.sourceCode { margin: 0; }
@media screen {
div.sourceCode { overflow: auto; }
}
@media print {
pre > code.sourceCode { white-space: pre-wrap; }
pre > code.sourceCode > span { text-indent: -5em; padding-left: 5em; }
}
pre.numberSource code
  { counter-reset: source-line 0; }
pre.numberSource code > span
  { position: relative; left: -4em; counter-increment: source-line; }
pre.numberSource code > span > a:first-child::before
  { content: counter(source-line);
    position: relative; left: -1em; text-align: right; vertical-align: baseline;
    border: none; display: inline-block;
    -webkit-touch-callout: none; -webkit-user-select: none;
    -khtml-user-select: none; -moz-user-select: none;
    -ms-user-select: none; user-select: none;
    padding: 0 4px; width: 4em;
  }
pre.numberSource { margin-left: 3em;  padding-left: 4px; }
div.sourceCode
  {   }
@media screen {
pre > code.sourceCode > span > a:first-child::before { text-decoration: underline; }
}

/* Cell styles */
.cell {
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.sourceCode {
  background-color: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.cell-code {
  padding: 1rem;
}

.cell-output {
  background-color: #ffffff;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

.cell-output-stdout {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 0.5rem 0;
}

.cell-output-display {
  text-align: center;
  padding: 1rem;
}

.figure {
  margin: 0;
}

.figure-img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Code copy button */
.code-copy-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: #2c5282;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.code-copy-button:hover {
  opacity: 1;
}

/* Syntax highlighting colors */
.sourceCode .im { color: #0066cc; } /* import */
.sourceCode .op { color: #666666; } /* operator */
.sourceCode .st { color: #cc0000; } /* string */
.sourceCode .co { color: #006600; font-style: italic; } /* comment */
.sourceCode .cf { color: #cc00cc; } /* control flow */
.sourceCode .kw { color: #cc00cc; } /* keyword */
.sourceCode .dv { color: #cc6600; } /* decimal value */
.sourceCode .fl { color: #cc6600; } /* float */
.sourceCode .bu { color: #cc00cc; } /* builtin */
.sourceCode .va { color: #cc6600; } /* variable */
.sourceCode .ch { color: #cc0000; } /* character */
</style>

<script>
// Simple copy functionality for code blocks
document.addEventListener('DOMContentLoaded', function() {
  const copyButtons = document.querySelectorAll('.code-copy-button');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const codeBlock = this.parentElement.querySelector('code');
      const textArea = document.createElement('textarea');
      textArea.value = codeBlock.textContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Visual feedback
      const originalText = this.innerHTML;
      this.innerHTML = 'Copied!';
      this.style.backgroundColor = '#48bb78';
      
      setTimeout(() => {
        this.innerHTML = originalText;
        this.style.backgroundColor = '#2c5282';
      }, 1000);
    });
  });
});
</script>
