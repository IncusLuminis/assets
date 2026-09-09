<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
  <head>
    <b:include data='blog' name='all-head-content'/>
    <title><data:blog.pageTitle/></title>
    <b:skin><![CDATA[/*
-----------------------------------------------
Blogger Template Style
Name:     Stretch Denim
Designer: Darren Delaye
URL:      www.DarrenDelaye.com
Date:     11 Jul 2006
-----------------------------------------------
*/

/* Variable definitions
   ====================
 <Variable name="bgColor" description="Page Background Color"
           type="color" default="#efefef" value="#000000">
 <Variable name="textColor" description="Text Color"
           type="color" default="#333333" value="#cccccc">
 <Variable name="linkColor" description="Link Color"
           type="color" default="#336699" value="#528bc5">

 <Variable name="headerBgColor" description="Page Header Background Color"
           type="color" default="#336699" value="#000000">
 <Variable name="headerTextColor" description="Page Header Text Color"
           type="color" default="#ffffff" value="#ffffff"> 
 <Variable name="headerCornersColor" description="Page Header Corners Color"
           type="color" default="#528bc5" value="#000000">

 <Variable name="mainBgColor" description="Main Background Color"
           type="color" default="#ffffff" value="#000000">
 <Variable name="borderColor" description="Border Color"
           type="color" default="#cccccc" value="#000000">
 <Variable name="dateHeaderColor" description="Date Header Color"
           type="color" default="#999999" value="#999999">

 <Variable name="sidebarTitleBgColor" description="Sidebar Title Background Color"
           type="color" default="#ffd595" value="#7f7f7f">
 <Variable name="sidebarTitleTextColor" description="Sidebar Title Text Color"
           type="color" default="#333333" value="#333333">
 
 <Variable name="bodyFont" description="Text Font"
           type="font" default="normal normal 100% Verdana, Arial, Sans-serif;" value="normal normal 100% Verdana, Arial, Sans-serif;">
 <Variable name="headerFont" description="Page Header Font"
           type="font" default="normal normal 210% Verdana, Arial, Sans-serif;" value="normal normal 210% Verdana, Arial, Sans-serif;">

   <Variable name="startSide" description="Start side in blog language"
             type="automatic" default="left">
   <Variable name="endSide" description="End side in blog language"
             type="automatic" default="right">
*/

body {
  background: $bgColor;
  margin: 0;
  padding: 0px;
  font: x-small Verdana, Arial;
  text-align: center;
  color: $textColor;
  font-size/* */:/**/small;
  font-size: /**/small;
}
a:link {
  color: $linkColor;
}
a:visited {
  color: $linkColor;
}
a img {
  border-width: 0;
}

#outer-wrapper { 
  font: $bodyFont;
}

/* Header
----------------------------------------------- */
#header-wrapper {
  margin:0;
  padding: 0;
  background-color: $headerCornersColor;
  text-align: $startSide;
}

#header {
  margin: 0 2%;
  background-color: $headerBgColor;
  color: $headerTextColor;
  padding: 0;
  font: $headerFont;
  position: relative;
}

h1.title {
  padding-top: 38px;
  margin: 0 1% .1em;
  line-height: 1.2em;
  font-size: 100%;
}

h1.title a, h1.title a:visited {
  color: $headerTextColor;
  text-decoration: none;
}

#header .description {
  display: block;
  margin: 0 1%;
  padding: 0 0 40px;
  line-height: 1.4em;
  font-size: 50%;
}
                                                              
/* Content
----------------------------------------------- */

.clear { 
  clear: both;
}


#content-wrapper {
  margin: 0 2%;
  padding: 0 0 15px;
  text-align: $startSide;
  background-color: $mainBgColor;
  border: 1px solid $borderColor;
  border-top: 0;
}
#main-wrapper {
  margin-$startSide: 1%;
  width: 64%;
  float: $startSide;
  background-color: $mainBgColor;
  display: inline;       /* fix for doubling margin in IE */
  word-wrap: break-word; /* fix for long text breaking sidebar float in IE */
  overflow: hidden;      /* fix for long non-text content breaking IE sidebar float */
}
#sidebar-wrapper {
  margin-$endSide: 1%;
  width: 33%;
  float: $endSide;
  background-color: $mainBgColor;
  display: inline;       /* fix for doubling margin in IE */
  word-wrap: break-word; /* fix for long text breaking sidebar float in IE */
  overflow: hidden;      /* fix for long non-text content breaking IE sidebar float */
}

/* Headings
----------------------------------------------- */
h2, h3 {
  margin: 0;
}

/* Posts
----------------------------------------------- */
.date-header {
  margin: 1.5em 0 0;
  font-weight: normal;
  color: $dateHeaderColor;
  font-size: 100%;
}
.post {
  margin: 0 0 1.5em;
  padding-bottom: 1.5em;
}
.post-title {
  margin: 0;
  padding: 0;
  font-size: 125%;
  font-weight: bold;
  line-height: 1.1em;
}
.post-title a, .post-title a:visited, .post-title strong {
  text-decoration: none;
  color: $textColor;
  font-weight: bold;
}
.post div {
  margin: 0 0 .75em;
  line-height: 1.3em;
}

.post-footer {
  margin: -.25em 0 0;
  color: $textColor;
  font-size: 87%;
}

.post-footer .span {
  margin-$endSide: .3em;
}
.post img {
  padding: 4px;
  border: 1px solid $borderColor;
}
.post blockquote {
  margin: 1em 20px;
}
.post blockquote p {
  margin: .75em 0;
}

/* Comments
----------------------------------------------- */
#comments h4 {
  margin: 1em 0;
  color: $dateHeaderColor;
}
#comments h4 strong {
  font-size: 110%;
}
#comments-block {
  margin: 1em 0 1.5em;
  line-height: 1.3em;
}
#comments-block dt {
  margin: .5em 0;
}
#comments-block dd {
  margin: .25em 0 0;
}
#comments-block dd.comment-footer {
  margin: -.25em 0 2em;
  line-height: 1.4em;
  font-size: 78%;
}
#comments-block dd p {
  margin: 0 0 .75em;
}

.deleted-comment {
  font-style:italic;
  color:gray;
}

.feed-links {
  clear: both;
  line-height: 2.5em;
}

#blog-pager-newer-link {
  float: $startSide;
 }

#blog-pager-older-link {
  float: $endSide;
 }
 
#blog-pager {   
  text-align: center; 
 }

/* Sidebar Content
----------------------------------------------- */
.sidebar h2 {
 margin: 1.6em 0 .5em;
 padding: 4px 5px;
 background-color: $sidebarTitleBgColor;
 font-size: 100%;
 color: $sidebarTitleTextColor;
}
                                                              
.sidebar ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.sidebar li {
  margin: 0;
  padding-top: 0;
  padding-$endSide: 0;
  padding-bottom: .5em;
  padding-$startSide: 15px;
  text-indent: -15px;
  line-height: 1.5em;
}
.sidebar {
  color: $textColor;
  line-height:1.3em; 
}
.sidebar .widget { 
  margin-bottom: 1em;
}

.sidebar .widget-content {
  margin: 0 5px;
}

/* Profile 
----------------------------------------------- */
.profile-img { 
  float: $startSide;
  margin-top: 0;
  margin-$endSide: 5px;
  margin-bottom: 5px;
  margin-$startSide: 0;
  padding: 4px;
  border: 1px solid $borderColor;
}

.profile-data {
  margin:0;
  text-transform:uppercase;
  letter-spacing:.1em;
  font-weight: bold;
  line-height: 1.6em;
  font-size: 78%;
}

.profile-datablock {
  margin:.5em 0 .5em;
}

.profile-textblock {
  margin: 0.5em 0;
  line-height: 1.6em;
}

                                                              
/* Footer
----------------------------------------------- */
#footer {
  clear: both;
  text-align: center;
  color: $textColor;
}

#footer .widget {
  margin:.5em;
  padding-top: 20px;
  font-size: 85%;
  line-height: 1.5em;
  text-align: $startSide;
}

/** DrMichael's styles**/
#container {
  background: url(http://www.box.net/shared/static/7gtu3zxgky.jpg) #000000 no-repeat;
  color: #ffffff;
  position: relative;
  height: 200px;
  width: 1200px;
  filter:alpha(opacity=90); /* IE's opacity*/
  opacity: 0.90;
  margin-left: 10px
    }

#container a {
      position: absolute;
    }

#container a img {
      border-style: none;
    }

#blah {
      top: 0px;
      left: 0px;
    }

#blah_1 {
      top: 20px;
      left: 1040px;
    }

/** Page structure tweaks for layout editor wireframe */
body#layout #header { 
  width: 750px;
}
]]></b:skin>
<link href='http://www.box.net/shared/static/u39svbaabp.ico' rel='shortcut icon'/>

<meta content='Новости астрономии и космонавтики' name='Живая Вселенная от доктора Майкла'/>
<meta content='Новости астрономии и космонавтики' name='Астрономия, космонавтика, мультимедиа, наглядные материалы, интерактив, подкаст, видеокаст, документальные фильмы, образовательные фильмы'/>
<meta content='65a4903e0bcebd9377b417ca4f8e9d89' name='p:domain_verify'/>


        
  </head>

  <body>
  <b:section class='navbar' id='navbar' maxwidgets='1' showaddelement='no'>
    <b:widget id='Navbar1' locked='true' title='Панель навигации' type='Navbar'>
      <b:includable id='main'>&lt;script type=&quot;text/javascript&quot;&gt;
    function setAttributeOnload(object, attribute, val) {
      if(window.addEventListener) {
        window.addEventListener(&#39;load&#39;,
          function(){ object[attribute] = val; }, false);
      } else {
        window.attachEvent(&#39;onload&#39;, function(){ object[attribute] = val; });
      }
    }
  &lt;/script&gt;
&lt;div id=&quot;navbar-iframe-container&quot;&gt;&lt;/div&gt;
&lt;script type=&quot;text/javascript&quot; src=&quot;https://apis.google.com/js/platform.js&quot;&gt;&lt;/script&gt;
&lt;script type=&quot;text/javascript&quot;&gt;
      gapi.load(&quot;gapi.iframes:gapi.iframes.style.bubble&quot;, function() {
        if (gapi.iframes &amp;&amp; gapi.iframes.getContext) {
          gapi.iframes.getContext().openChild({
              url: &#39;https://www.blogger.com/navbar/6261727348513450450?origin\x3dhttp://localhost:80&#39;,
              where: document.getElementById(&quot;navbar-iframe-container&quot;),
              id: &quot;navbar-iframe&quot;
          });
        }
      });
    &lt;/script&gt;&lt;script type=&quot;text/javascript&quot;&gt;
(function() {
var script = document.createElement(&#39;script&#39;);
script.type = &#39;text/javascript&#39;;
script.src = &#39;//pagead2.googlesyndication.com/pagead/js/google_top_exp.js&#39;;
var head = document.getElementsByTagName(&#39;head&#39;)[0];
if (head) {
head.appendChild(script);
}})();
&lt;/script&gt;
</b:includable>
    </b:widget>
  </b:section>


<div id='fb-root'/>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = &quot;//connect.facebook.net/en_US/all.js#xfbml=1&quot;;
  fjs.parentNode.insertBefore(js, fjs);
}(document, &#39;script&#39;, &#39;facebook-jssdk&#39;));</script>

  <div id='outer-wrapper'><div id='wrap2'>

    <!-- skip links for text browsers -->
    <span id='skiplinks' style='display:none;'>
      <a href='#main'>skip to main </a> |
      <a href='#sidebar'>skip to sidebar</a>
    </span>


<div id='header-wrapper'>
<b:section class='header' id='header' maxwidgets='1' showaddelement='no'>
  <b:widget id='Header1' locked='true' title='Живая Вселенная (заголовок)' type='Header'>
    <b:widget-settings>
      <b:widget-setting name='displayUrl'>https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEirKOEv0RAuCju-zCrQAddLf3zFI48qMzfVhLu93FIWSZ7rpD2CoD4vKnpMu72kCIotOgNX38-_gSdlz9ntSEQP6Ip6yX6Pof9-IwdkBq5VTaGZpdVnYNm84yktwEYea3BeBpGRCAtgZZ4/s760/Liveuniverse.jpg</b:widget-setting>
      <b:widget-setting name='displayHeight'>80</b:widget-setting>
      <b:widget-setting name='sectionWidth'>760</b:widget-setting>
      <b:widget-setting name='useImage'>true</b:widget-setting>
      <b:widget-setting name='shrinkToFit'>true</b:widget-setting>
      <b:widget-setting name='imagePlacement'>REPLACE</b:widget-setting>
      <b:widget-setting name='displayWidth'>760</b:widget-setting>
    </b:widget-settings>
    <b:includable id='main'>

  <b:if cond='data:useImage'>
    <b:if cond='data:imagePlacement == &quot;BEHIND&quot;'>
      <!--
      Show image as background to text. You can't really calculate the width
      reliably in JS because margins are not taken into account by any of
      clientWidth, offsetWidth or scrollWidth, so we don't force a minimum
      width if the user is using shrink to fit.
      This results in a margin-width's worth of pixels being cropped. If the
      user is not using shrink to fit then we expand the header.
      -->
      <b:if cond='data:mobile'>
        <div id='header-inner'>
          <div class='titlewrapper' style='background: transparent'>
            <h1 class='title' style='background: transparent; border-width: 0px'>
              <b:include name='title'/>
            </h1>
          </div>
          <b:include name='description'/>
        </div>
      <b:else/>
        <div expr:style='&quot;background-image: url(\&quot;&quot; + data:sourceUrl + &quot;\&quot;); &quot;                      + &quot;background-position: &quot;                      + data:backgroundPositionStyleStr + &quot;; &quot;                      + data:widthStyleStr                      + &quot;min-height: &quot; + data:height                      + &quot;_height: &quot; + data:height                      + &quot;background-repeat: no-repeat; &quot;' id='header-inner'>
          <div class='titlewrapper' style='background: transparent'>
            <h1 class='title' style='background: transparent; border-width: 0px'>
              <b:include name='title'/>
            </h1>
          </div>
          <b:include name='description'/>
        </div>
      </b:if>
    <b:else/>
      <!--Show the image only-->
      <div id='header-inner'>
        <a expr:href='data:blog.homepageUrl' style='display: block'>
          <img expr:alt='data:title' expr:height='data:height' expr:id='data:widget.instanceId + &quot;_headerimg&quot;' expr:src='data:sourceUrl' expr:width='data:width' style='display: block'/>
        </a>
        <!--Show the description-->
        <b:if cond='data:imagePlacement == &quot;BEFORE_DESCRIPTION&quot;'>
          <b:include name='description'/>
        </b:if>
      </div>
    </b:if>
  <b:else/>
    <!--No header image -->
    <div id='header-inner'>
      <div class='titlewrapper'>
        <h1 class='title'>
          <b:include name='title'/>
        </h1>
      </div>
      <b:include name='description'/>
    </div>
  </b:if>
</b:includable>
    <b:includable id='description'>
  <div class='descriptionwrapper'>
    <p class='description'><span><data:description/></span></p>
  </div>
</b:includable>
    <b:includable id='title'>
  <b:tag cond='data:blog.url != data:blog.homepageUrl' expr:href='data:blog.homepageUrl' name='a'>
    <data:title/>
  </b:tag>
</b:includable>
  </b:widget>
</b:section>
</div>


    <div id='content-wrapper'>

      <div id='crosscol-wrapper' style='text-align:center'>
        <b:section class='crosscol' id='crosscol' showaddelement='no'>
          <b:widget id='HTML11' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<!-- News Feed -->
<!-- start sw-rss-feed code --> 
<script type="text/javascript"> 
<!-- 
rssfeed_url = new Array(); 
rssfeed_url[0]="http://feeds2.feedburner.com/nebulacast";  
rssfeed_frame_width="280"; 
rssfeed_frame_height="80"; 
rssfeed_scroll="on"; 
rssfeed_scroll_step="6"; 
rssfeed_scroll_bar="off"; 
rssfeed_target="_blank"; 
rssfeed_font_size="14"; 
rssfeed_font_face="Arial"; 
rssfeed_border="off"; 
rssfeed_css_url=""; 
rssfeed_title="off"; 
rssfeed_title_name=""; 
rssfeed_title_bgcolor="#3366ff"; 
rssfeed_title_color="#fff"; 
rssfeed_title_bgimage=""; 
rssfeed_footer="off"; 
rssfeed_footer_name="rss feed"; 
rssfeed_footer_bgcolor="#fff"; 
rssfeed_footer_color="#333"; 
rssfeed_footer_bgimage=""; 
rssfeed_item_title_length="50"; 
rssfeed_item_title_color="#55a0ff"; 
rssfeed_item_bgcolor="#000"; 
rssfeed_item_bgimage=""; 
rssfeed_item_border_bottom="on"; 
rssfeed_item_source_icon="off"; 
rssfeed_item_date="off"; 
rssfeed_item_description="off"; 
rssfeed_item_description_length="120"; 
rssfeed_item_description_color="#fff"; 
rssfeed_item_description_link_color="#55a0ff"; 
rssfeed_item_description_tag="off"; 
rssfeed_no_items="0"; 
rssfeed_cache = "abf2a2509f85e260762acf9cb0c9424e"; 
//</script> 
<div style="left: 660px; position: absolute; top:40px;">
<script src="//feed.surfing-waves.com/js/rss-feed.js" type="text/javascript"></script> 
<!-- The link below helps keep this service FREE, and helps other people find the SW widget. Please be cool and keep it!
<div style="color: #cccccc; font-size: 10px; text-align: right; width: 400px;">
powered by <a href="https://surfing-waves.com/" rel="noopener" style="color: #cccccc;" target="_blank">Surfing Waves</a></div>
 Thanks. -->
</div>
<!-- end sw-rss-feed code -->]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='HTML12' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<div style="left: 54px; position: absolute; top: 103px;">
  <a href="https://www.youtube.com/@Nebulacast">
    <img alt="Наш старинный приятель, оригинальный канал в Ютьюбе." src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_7ZzCwVk4_HbNFg0zpfXfGmFFobZY2w3MhElcdMY7hbjSLXPNfhWAxgSqKFT4ZnnBfLwF46c8KR2xdrNs7qNmtqr9-l2o6ZSqzFvASKfHEtOvxWGml4MzwF37G755oamiOIlwA_TbUykFKj8-YlY8bVmR-dW-B03eLjUV_pUmXMtivah2S9s2ClKSDGI/s1600/Crab_Button_32x32.png" />
  </a>
  <a href="https://www.youtube.com/@StellarAttractor">
    <img alt="Новый англоязычный канал Stellar Attractor" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhRiZKM44ZiHALy_bRcSIpMbGsS7EQrS-jF5dhv4ICsOOarR3S__EuTFCIVXc8RlWbDCIA6y055mSWMSLpjZp1KEBwJ-_eRcE6QnVaQQgBZjKc5daOFTVJYOtdMWxSF2yJ5btfh7mxFxzaDfmXziOgDBPUsIW0grz-so3wn1MVpLHIpEb4nF8yqYVt6_M8/s1600/Halvorsen_Button_32x32_rounded.png" />
  </a>
<a href="https://dzen.ru/liveuniverse">
    <img alt="Русский Дзен" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgeDVFdmMxdEPpbgBqhIE1vBjkPipedNA5oFjL_4_U6oUTHyXgtrMRyNgUvSZibB0OBuUDnO_y51KJIr8Yv_EiizE-65ad1TgtU8ruQF97NIuc9cRNaRVwO1pFYO71Q-j7YdNyucAMwP59LQuL1rN-QCpWy3aNIO5PBQXpaJ5-q05-fZ9k7B-qqFeanfRk/s1600/Dzen-Icon-Logo-Vector.svg--2.png" />
  </a>
<a href="https://rutube.ru/channel/3440803/">
    <img alt="Рутьюб, тут все понятно" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjlNp0IRdc4aCx0m4Pspa07GPtYuJZxMwG8s0gz2hGHr0OAFSfFLiKW-TJzAOf0MGjY1hm0OI0ppQUdzEXBaAiIGEFLcxj9MsRcM1y4Agq1kSDQm4WFQ_zEQaec95jkYouwDWXJx4piC6MllPnkU99iF1AqyDach5lDLoQYdWqweaaQrb_Rg6nvo24Lwt0/s1600/rutube.png" />
  </a>
  <a href="https://vkvideo.ru/@live_universe">
    <img alt="Видео ВКонтакте" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhH9iO9nrF9cffwKPQ_oc7afvJXoSGQw6rM5PrSj9O6volf8WmimdVBrn16NnL9n_WtzN56Iq5SWAMszOD202sIJj8sLMvDu64x2yVZkoiRyT3JxSWRSPMc-2WQXhPylfZ-EEHY16OGPasGalu-qUwgL_qye--opXQviztGIkKajdsbeVusCev-coXr_dw/s1600/VK_Video_32x32.png" />
  </a>
<a href="https://plvideo.ru/channel/h6evya83SpC8">
<img alt="Платформа - новое решение" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhLJ595jTSOQwYiKrNXYASp3_YGtPdAa9TAfee0MkflgWsBJBd5GzsBFV4ZAsBYpYSQMJUzXWIqsZ_seTP2nCC0w4k0W_bbFvVurPHHiTQLUXHoA-BzSQ_8xrrLPZ1p9jDEwS3tET4R8iQ3BtRUefdOOJzHzp_t1EsdbzGDyKbN_MukMRrX_8OMKMole2I/s1600/plvideo-2.png" />&nbsp;
  </a>
  <a href="https://vk.com/live_universe">
    <img alt="ВКонтакте" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjsY27IvujnEdv2Pb2cz6GDh-9OFbFizcOELJsRuyo5d4mhuq_ZiA31EqmMmqvsei3pXTnhiRAhhvxP56Anfp9_SN2norm3b3uEBi0QnEmQzqCqgoVEVkLD6WVKVD-12jKLlswL97anObihoevlAKCDDibBsM3jKT3S8lY8NJOprtr6l1xXcb55-MWN1As/s1600/vk.png" />
  </a>
  <a href="https://t.me/liveuniverse">
    <img alt="Телеграмм" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhEEH4j5T6eKvgmBpuGvOF-qUTCqQXy5UF2gDp79zY4bVDbl3nytiQcRTmp67E7dAAUeAx49a0nomJ5WYkm8GtfHvaBemH5xlkyeysnO9uPXIJJoot_JzkyaU_Rr3h7NExprjMRyf-IlrlqrBaInS1VsEGYwbnUoG4760YCA1jXD2NiymA_PmluZ3wS438/s1600/telegram.png" />
  </a>
  <a href="https://drmichaelvideos.livejournal.com">
    <img alt="ЖЖ" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhoOxussRLKSVBZsdnRwAEMZK1VCqfXwE5sgW0I40KTX-DiEBXC3LV9Bwak1q7noWceZjbxtDD3rIm5z89-Aso7Px-kyEc5zqctKGKLAQ8JENpeQKa3DtxFgVNU6m1F6angF1pikd4tkD8-98rzKsghk3sa4w1gRxX5zmHW5FcsFSIt5MmEoIuaicMWlAU/s1600/livejournal.png" />
  </a>
  <a href="https://www.tiktok.com/@stellar.attractor.ru">
    <img alt="Тикток" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8C7pDkVZ8kdQ1Q9THEbFFM1tlCB33FWNU5Y8XeFRqCAfcRDeFytpZXKcz27pChepYPCEdlx0txXkrO8BtQLLkIknVrVeJKXtTJixXgSUq7Q3zdpSdn4hJ7kFhN3w9mpRdHobwzRt6yeA-7sZBfnIW3nUre5zZM7TRecVDPyOhJzocU-u0movS-oMnB_o/s1600/tiktok.png" />
  </a>
  <a href="https://www.instagram.com/stellar.attractor/">
    <img alt="Англоязычный Инстаграмм для шортов и рилзов" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiUMI3rPgBVzC9JGGz9JHLCyWgx6etx_EPkR-14UAUbV6lSxeLVg_2KcMLFK56bpJ12eJZ1x-nrHmP01PY8U2lacDDe9gkhRXMgWl4b1rBqNfgs4BP4szbkon5eJ8YDUXLK84UUe8pdQCithxW-Bbi7znVz0Jp3LYZbc1jRIdgLScuPpRdgfNkQhDn3nPA/s1600/instagram.png" />
  </a>
<a href="https://x.com/DrMichaelVideos">
<img alt="Двуязычный твиттер для поддержки выходящих роликов" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjW83mY874ByypA1qtCbz8JUyZnHMfGhNj04aKPf8Tk-x2pS5D2ACCsku9Xk_r9GTQIf6zRRiFDzL7UC-2vHbFFOg6Sm3RKPZopI5gXaCtxtR-zK28wef3EWCxIPCiqCj2efk2B6aNtS36ehyrkSXJwNpusWQD5wp5pPiRPvflDggkffphiWpJPOrcFJpo/s1600/X.png" />
  </a>&nbsp;
<a href="https://itunes.apple.com/pl/podcast/%D0%BF%D1%80%D0%BE-%D0%B2%D1%81%D0%B5%D0%BB%D0%B5%D0%BD%D0%BD%D1%83%D1%8E/id1451038281?mt=2&app=podcast" target="_blank"><img alt="Apple Podcast" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhrj_-1m1CotSTvpahh5flYoctHzNUClJxzQYw73m5WkImMhW3YyC7jZc2llX7L4MXLDTEOMnHDHce4pQaxgJBCKeXP7EKHR7GxunS_qLjLYeTDxGPFNGJQyTSxG_X24yKgZCslRmB3nnARV9lhFdH7De7S2xuKsZdrLoA3Rm2KADMI5q20n251x87-5oo/s1600/Apple.png" / /></a>
<a href="http://live-universe.podomatic.com/" target="_blank"><img alt="Podomatic" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjDTjK4LTbvjEDmUwOHB4ETNXRkS19EGmqu4LDYMEzIcf0eMGU4zb-isNyykh92v4YYbQQ7_0ybM2yV1KVBLjlqJ1SbpUgVEaU8qT9R5URmJ0X61Z9azF4XvEtjZu62OINHUtTEd-9BMHBCIjLOcV0OhF28qJC2sAOrp58-0I179hxIhTRMOFzDU3cj0Q8/s1600/icon_blueBgd-2.png" / /></a>
<a href="https://soundcloud.com/user-832590029" target="_blank"><img alt="SoundCloud" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiHHX8apcEAT3nykY6q_EyV6QLU4lBasSehh_hmnUArmgFfzchZoQBHY1K7b79b0HaJFI49L23lQEGv4KHcX9UIzKZb5wjDKWm6y-1NGI6azQNJP4qa3f5byrBEBxp5c0AaSQVOzSLUVq3eAOLIB7-wXG43qhHozkduV7CZNPnwpoxh2gG1yq3UKcUtbec/s1600/soundcloud.png" / /></a>&nbsp;
<a href="http://feeds2.feedburner.com/nebulacast" target="_blank"><img alt="RSS Feed" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaSIoGxy8YiGzHFpl7cVn7-vAK-6f_qH0erFTVAe322Tjcq91CLjnsWS2iKCqCP7N5aC7kZNjDKW6Srjq5RoGCD4uWBI5V0U0MdVEpSjt9noq5EO0a4EiZxj-any6gtBaCIhJcFJqYFfVpli9_yDW9_ISL49Gvoddo4OPQIhMPcbnExneXAVl5IC8EbYs/s1600/rss-2.jpg" / /></a>
</div>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
        </b:section>
      </div>

      <div id='main-wrapper'>
        <b:section class='main' id='main' showaddelement='no'>
          <b:widget id='HTML9' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<style>
ul#css3menu1,ul#css3menu1 ul{
	margin:0;list-style:none;padding:0;background-color:#dedede;border-width:1px;border-style:solid;border-color:#5f5f5f;-moz-border-radius:5px;-webkit-border-radius:5px;border-radius:5px;}
ul#css3menu1 ul{
	display:none;position:absolute;left:0;top:100%;-moz-box-shadow:3.5px 3.5px 5px #000000;-webkit-box-shadow:3.5px 3.5px 5px #000000;box-shadow:3.5px 3.5px 5px #000000;background-color:#FFFFFF;border-radius:6px;-moz-border-radius:6px;-webkit-border-radius:6px;border-color:#d4d4d4;padding:0 10px 10px;}
ul#css3menu1 li:hover>*{
	display:block;}
ul#css3menu1 li{
	position:relative;display:block;white-space:nowrap;font-size:0;float:left;}
ul#css3menu1 li:hover{
	z-index:1;}
ul#css3menu1 ul ul{
	position:absolute;left:100%;top:0;}
ul#css3menu1{
	font-size:0;z-index:999;position:relative;display:inline-block;zoom:1;padding:0;
	*display:inline;}
* html ul#css3menu1 li a{
	display:inline-block;}
ul#css3menu1>li{
	margin:0;}
ul#css3menu1 a:active, ul#css3menu1 a:focus{
	outline-style:none;}
ul#css3menu1 a{
	display:block;vertical-align:middle;text-align:left;text-decoration:none;font:bold 14px Trebuchet MS;color:#000000;text-shadow:#FFF 0 0 1px;cursor:pointer;padding:10px;background-color:#c1c1c1;background-image:url("mainbk.png");background-repeat:repeat;background-position:0 0;border-width:0 0 0 1px;border-style:solid;border-color:#C0C0C0;}
ul#css3menu1 ul li{
	float:none;margin:10px 0 0;}
ul#css3menu1 ul a{
	text-align:left;padding:4px;background-color:#FFFFFF;background-image:none;border-width:0;border-radius:0px;-moz-border-radius:0px;-webkit-border-radius:0px;font:14px Tahoma;color:#000;text-decoration:none;}
ul#css3menu1 li:hover>a,ul#css3menu1 li a.pressed{
	background-color:#f8ac00;border-color:#C0C0C0;border-style:solid;color:#000000;text-shadow:#FFF 0 0 1px;background-image:url("mainbk.png");background-position:0 100px;}
ul#css3menu1 img{
	border:none;vertical-align:middle;margin-right:10px;}
ul#css3menu1 span{
	display:block;overflow:visible;background-position:right center;background-repeat:no-repeat;padding-right:0px;}
ul#css3menu1 ul span{
	background-image:url("arrowsub.png");padding-right:12px;}
ul#css3menu1 > li.switch{
	display:none;cursor:pointer;width:25px;height:20px;padding:10px;}
ul#css3menu1 > li.switch:before{
	content:"";position:absolute;display:block;height:4px;width:25px;border-radius:4px;background:#000000;-moz-box-shadow:0 8px #000000, 0 16px #000000;-webkit-box-shadow:0 8px #000000, 0 16px #000000;box-shadow:0 8px #000000, 0 16px #000000;}
ul#css3menu1 > li.switch:hover:before{
	background:#000000;-moz-box-shadow:0 8px #000000, 0 16px #000000;-webkit-box-shadow:0 8px #000000, 0 16px #000000;box-shadow:0 8px #000000, 0 16px #000000;}
.c3m-switch-input{
	display:none;}
ul#css3menu1 li:hover>a,ul#css3menu1 li > a.pressed{
	background-color:#f8ac00;background-image:url("mainbk.png");background-position:0 100px;border-style:solid;border-color:#C0C0C0;color:#000000;text-decoration:none;text-shadow:#FFF 0 0 1px;}
ul#css3menu1 ul li:hover>a,ul#css3menu1 ul li > a.pressed{
	background-color:#FFFFFF;background-image:none;color:#868686;text-decoration:none;}
ul#css3menu1 li.topfirst>a{
	border-radius:5px 0 0 5px;-moz-border-radius:5px 0 0 5px;-webkit-border-radius:5px;-webkit-border-top-right-radius:0;-webkit-border-bottom-right-radius:0;}
ul#css3menu1 li.toplast>a{
	border-radius:0 5px 5px 0;-moz-border-radius:0 5px 5px 0;-webkit-border-radius:0;-webkit-border-top-right-radius:5px;-webkit-border-bottom-right-radius:5px;}
@media screen and (max-width: 769px) {
	ul#css3menu1 > li {
		position: initial;}
	ul#css3menu1 ul .submenu,ul#css3menu1 li > ul {
		left: 0; right:auto; top: 100%;}
	ul#css3menu1 .submenu,ul#css3menu1 ul,ul#css3menu1 .column {
		-webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box;padding-right: 0;width: 100% !important;}
}
@media screen and (max-width: 768px) {
	ul#css3menu1 {
		width: 100%;}
	ul#css3menu1 > li {
		display: none;		position: relative;		width: 100% !important;}
	ul#css3menu1 > li.switch,.c3m-switch-input:checked + ul#css3menu1 > li + li {
		display: block;}
	ul#css3menu1 > li.switch > label {		position: absolute;cursor: pointer;top: 0;left: 0;right: 0;bottom: 0;}}

span.divider {
  display: block;
  height: 1px;
  background-color: #888;
  margin: 6px 0;
}

</style>

<div style="position:relative; left:0%; top:26px;">
<!-- Start css3menu.com BODY section -->
<input type="checkbox" id="css3menu-switcher" class="c3m-switch-input" />
<ul id="css3menu1" class="topmenu">
	<li class="switch"><label onclick="" for="css3menu-switcher"></label></li>
	<li class="topfirst"><a href="#" style="height:18px;line-height:18px;"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiyqllKY-tWsLxLMyQ-eWqGZoqIydacpgBDGkCKaWSq4eLv3M73eSFGlOZ_cIWIlnjemS6s9yphLvfju36gmIb26K0Qfhnu4_eaDHQX-PsCdSBSXikmeaLVaDyen5hNQwAeRxhbo7JWzQDMLyQUjgtKkUcjng07NLECRNfTs5tohDEaip-nw3fhcxF5CF8/s16/hamburgers-icon-png-5959.png" alt=""/><span></span></a>
	<ul>
		<li><a href="https://www.nebulacast.com/p/blog-page.html">🌐 Атлас Живой Вселенной</a></li>

<li><a href="https://www.nebulacast.com/p/exp.html">📆 Календарь премьер</a></li>

<li style="list-style:none; padding:0; margin:0;">
    <span class="divider"></span>
</li>


<li><a href="http://www.nebulacast.com/p/blog-page_5262.html">❓ЧаВо</a></li>

<li><a href="http://www.nebulacast.com/p/pr.html">📢 PR</a></li>


</ul></li>

<li class="topmenu"><a style="height:18px;line-height:18px;"><span>Мультимедиа</span></a>
<ul>

<li><a><span>📺  Видео > </span></a>
<ul>

<li><a href="http://www.nebulacast.com/p/air.html"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhE1P758Aks7Y4hTokoVk15O8QDgE9XdOpDU9W_fhTCaAFh2KvKK648_5nLIb6N7YxuIOSfjHYZ0qn2nD1TMM8IUODN0LMFTV-rPEcfcwmEMby8W0kEACOrOjHg7qZ-Nqr1yGnRVNiBo0I/s32-no/tv32x32.png" alt=""/>TV</a></li>

<li><a href="http://www.nebulacast.com/p/exp.html"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhE1P758Aks7Y4hTokoVk15O8QDgE9XdOpDU9W_fhTCaAFh2KvKK648_5nLIb6N7YxuIOSfjHYZ0qn2nD1TMM8IUODN0LMFTV-rPEcfcwmEMby8W0kEACOrOjHg7qZ-Nqr1yGnRVNiBo0I/s32-no/tv32x32.png" alt=""/>Премьеры</a></li>

<li><a><span><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6C2_NJh7ndia2ADy7ymnBadX0t58ipBOeN86ofoN6Q5Uxf2sefdmneA16ngjxft0yYKtJTQpfWuW2WXtOg1i629C2_pWu7X8DmntZu_1mlpwe4KtyMWjENTuT6ePU39toinvLJNuWEKXnGfYIRc98LNoqwV3UaL66E8wrfqPsw9Xzpg3vpHQY4aV31uU/s33/crab_32.png" alt=""/>Наши ролики > </span></a>
<ul>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqlPOTqOYOJFND0EFOKZSgn4"    target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBGxj7wJwejPRfRr6icwCk-kBUbKwxGkQjgbWmZmS-iZ56OUXYC1Ajsny-kB1HKKxrygVvEJpYrwcQt-VMurOcS__1SLA65-rrDkwnMecCuJIQwVr9uSVQ_H1P3UVcArBcD_3wAQVnXF-zJIXOXCFwHHzOcmoR821szo68N1Ten2CzUFwGvWfpgYpB2ns/s32/Max_9_2_32.png" width="32px" alt=""/>Небесные Хроники</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqmYUNDd74XEMBY5BmN0gIt5"   target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhm_FdM6e6Bjoq9J7vVfoh5LtPyTX_C64_pMQHsghIuO0Yl5rfXrhwYF151dfzQPtHGhCVW24YM1mUyEmqiXbabeZfUNVIp4d6MDWmWeJdXcGE42AMi5SaGWJp6FtZBvScTB2AJzFsXCETC7noHEGAZEm-6XXG7aFGS_B8LI3VG7Ke-dqf3Tn2DTsAfz4E/s33/Max_10_1_32.png" width="32px" alt=""/>Минутка астрофизики</a></li>


<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqneti8VnyQNFBSIjayTWgd1" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjtdz-CokS47DaECSXRaXTIKYY6U0Sr3qkrRRojfVQ__3EvBZPrsPMRKapaN_to_bveqsOL4HMyoil7chWXXmaS5O-pqhjNsmV5ASQgj9PUVaVY29Jp6W9kcf2c-i5IH8KT29eT5sHUfPU/w32-h22-no/" alt=""/>Светопись</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqk6DmnG5mvYuD92-wwab8mQ" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_lvJhfjny_17fDo2QHI86d7LhfymqjResgdeotk4KpmEeldOCw3pcRMLtNSpWi8s12SrhKaJr_6gfsl6xZv918qXDOMOyB400Jx52-JNeGI2NyRrXw0g0no5WRyhhDzOLLSh9iBuocNUSltKwrrtt3cBY-x9Vs5jT-xyv_rg0ZTKbwAvZaz7yEzokxZQ/s35/1_2_32.png" alt=""/>Про Вселенную</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqmoRyIIxPo2TRZ8oS9iePcY"  target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhdGIRfG7JdVhF-kM6lhY8yFbSEKJvwPpvBMjqpMDsxAMF8nzqeTTbmM5LqUIEM_bbZlQzt6DQAFJJ5a87kKKJnTgqoFRvpu1N0HZA3OlpySwpl74OHsk8ByMDcQaLUgrc5QpDoTB07wa2P58Brec8Es1211106KVXfnDuDyxpeuX3FZ3fZ5gLa9IYqd2o/s32/1_6_32.png" alt=""/>3I/ATLAS</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqnwzcXSdAdjrrvjsYpsMVmD" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhuh5WADrImLyPCu1AH-PKSROvNjOhpRkz41X18ysLTRnr9LLn673aDpssFjjPh8a7J-hvSaMgHq3lCDhSvRwhhRAsGVdcU39fi7haC77nzV6ktOOgYPf9GJR9U5wKnTvdrufNJ9ERtOxbvgifBiI7w36TWiSTYGczns-Nhc8npbeDjinMNut570vEa64o/s33/me-4_32.png" alt=""/>Внегалактический Вестник</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLBD2A8792768631D4" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjm13h3yMsiyBfDwM3OXT32S_ZxF1yJK0N5_DKvdzB4YsN-u9XVs-Mo8iP0EloWGiQUfxoAo5qkSxEnbNzAEBMOZCVui0QK-zFnH3UbqcJJP6i9tBujKO2xGR0Rexsm9z9R_HXMs3ib0NQ/w51-h64-no/" width="32px" alt=""/>Мессье и его звери</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqmj-R92w8mxCimPzoGuE6GH" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj9Sj2ygOqXmvCkhsnZp27T39qf1MIGvv19yZZQCqapi5JJkmeyM3lmW8AcNagNFx7arSgUnwLyYHZkPLJ45LZvbQUQ46-rhxu04vqr6qs-MjiFVbbSoSCQCPSDDNNApUGcgR7ZdEQyHAg/w19-h32-no/" alt=""/>Интервью</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqlpAkHhi6SmQCmU3fb5jCsp" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnTFpcANd0qigAj4f_wGExa4ZOShC2NtIkvY00-BsthQgYgineEvskMuqKaF0bg_R93OMbPZLEi37s1G6AiTg1DcMxeL8a5QWFi3_S7YCM41-tDo_rEXIC9iAzgXogXeY4tLpWjyTZ-cw/w31-h32-no/" alt=""/>Обсерватории</a></li>

</ul></li>

<li><a><span><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6C2_NJh7ndia2ADy7ymnBadX0t58ipBOeN86ofoN6Q5Uxf2sefdmneA16ngjxft0yYKtJTQpfWuW2WXtOg1i629C2_pWu7X8DmntZu_1mlpwe4KtyMWjENTuT6ePU39toinvLJNuWEKXnGfYIRc98LNoqwV3UaL66E8wrfqPsw9Xzpg3vpHQY4aV31uU/s33/crab_32.png" alt=""/>Вселенная Звёздного Аттрактора > </span></a>
<ul>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqkBRBTrW9DmslsujlvGM1b4"    target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhAEJVqQjR1RY5CfKJVN9GVFF9-DjozJ4gjL5hsJLlTcX0qAIdv-XBiDrxgymU5PJLpcq7AIefjSYrUoIPdorE1orVlezeF211C7tUBlJCujhQuoSxA9meCwX80wwUVn-POFR96mP7YhU8ieEccIw6Srin22ivHjAm1JB9trNBh_jAGV0DdYO85OwZfNNg/s34/CMK2_0_Helmet_1_32.png" width="32px" alt=""/>Звёздный Аттрактор</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqnH-BtLWEv7E6UjZZe7jbfl"   target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhmj3s0P_hZhWPfVv3V4BQA2xq9PjuHX7K4xga8wlO1zhg6wmLKIY1-284Lwl3nQDiR-CLNWMCVrQlYfQLUXZIWJ8KP4qv-S7LlWshZv47DpLUJwTTsooBXGWWQ7jMIY8eJU1opHOnTYPp8NEstwIemj5PgQvA1tqnt6f1R_E6EGqk4OT5fR-0bIfti_JQ/s32/Zane_0_Zoom_Transparent%20copy.png" width="32px" alt=""/>Дневник Зейна</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqlDeQZBkHKej_OciFkRFwJ7"  target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhW7fOPMCzOFR1a-aEMo8nelxzRO74cL6Az3qhvS7EasqWShScJo3Pe9oLoig4NQPzPxDVfnN3LL0CIe9x_BYrnu3qajM-9ws34zx7wE3irEl-gZ5SSjVdwa6sYbyQxC_BfAfcRmaXpQhZHR2sW_4aGjyu5kPr1FZac1CwBDfiPB63da8l-umJks6kef5M/s38/Marchand_32.png" width="32px" alt=""/>Академия</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqmAqRJ39ULgjLZs4drt7SZw"  target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiCkYu8Wn-OfGv9bmsM8fYHhtFPtyB8nWO6NvrF6iy_fO1NJvsD6p1FMQz836VLb_6rXc_4SBcMT21VjvcoR-pwiC-jE-hNL8N9lPqZR9m4ves6SY-OAFqipUMKJNdWHNhNcKrlEW7AybbMmDrebo0DWcN6uODPI0Lz-w3HV9PY5oOD55QXs40S57WSr_w/s32/Akemi_32.png" width="32px" alt=""/>32я База. Наследие</a></li>

</ul></li>

<li><a><span><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6C2_NJh7ndia2ADy7ymnBadX0t58ipBOeN86ofoN6Q5Uxf2sefdmneA16ngjxft0yYKtJTQpfWuW2WXtOg1i629C2_pWu7X8DmntZu_1mlpwe4KtyMWjENTuT6ePU39toinvLJNuWEKXnGfYIRc98LNoqwV3UaL66E8wrfqPsw9Xzpg3vpHQY4aV31uU/s33/crab_32.png" alt=""/>Переводы > </span></a>
<ul>

<li><a href="https://www.youtube.com/playlist?list=PLD40C13E69574753C" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgPSVvowiHSmbPmT20AB2b6ZMxtdMTJGpoFskmxDOTDuowdxFwmDibsxSXi2UCYrA4PPb7BSzbOkqDaDHepL6r1juQoUgn2EMV1ovZ4WGqmnCzhArX4yrcKu1HoGEkiH8cgWcc5eZsMHnU/s32-no/" alt=""/>Прекрасная Вселенная Чандры</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqleLjcMGtqKjgQfebcPmUEQ" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgLDoVGSRZEoIzDeph3uuEfM00Yu95l6qACGS9k8h99Gl7SLQ2JqiOsZWpbaN8rqHwlFrBHj0qQgOvZZJoSuJOyBjzi1R0KSlrsIOg1fF6lVaWg9UUXtHMxARrLhmG8wSHb1mL-tsdSJmhc/w32-h26-no/" alt=""/>Goddard</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqkYxwqZhKJT6uKfR0_qth0b" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQLUp9DY9uAUClKYICGyshi2fLgMYX9knky9g7yCUjoBGYR9NbkaWXCqcu9_15l2UN0j8iDIeZt-MznPojFRpAV_hIzE1m0M0q8NAg3Jnd2XGnejOoZLNyolm0l7Y24h6w8tushTyBJp8/s32-no/" alt=""/>JPL</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplql8R0HNxkTUtCOREDyfu1Ms" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiiip-ZnmQbeMwOd3ebQvtb5ffvBqHOoRwp29t0pBinRfnvAgqCr0PuiVntrul-8a0Q18sG1AjznYtWYUGsG-lIYCdCwYE__-Lzj92jAefjOBVrjeR5Fu2ATgmMH-kfUTLER22ASj2-bRI/s32-no/jwst32x32.png" alt=""/>JWST</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLDD2D204A5A461CB5" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgLDoVGSRZEoIzDeph3uuEfM00Yu95l6qACGS9k8h99Gl7SLQ2JqiOsZWpbaN8rqHwlFrBHj0qQgOvZZJoSuJOyBjzi1R0KSlrsIOg1fF6lVaWg9UUXtHMxARrLhmG8wSHb1mL-tsdSJmhc/w32-h26-no/" alt=""/>NASA</a></li>


<li><a href="https://www.youtube.com/playlist?list=PL995F2CD7681C9670" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjAieYm5muEO7KgOTiZZGYdOBf-M7iHXX2nfaj52ksIYGibyLM9osZzfs67t18C0E61dkFJrR-FvJQZpYvybSUfHv7PY2mfnLU-q0QwQGqbnFBpGCQpDPlj7nL79uyRZEBgNqd0SeNM4ek/s32-no/esocast_s32x32.png" alt=""/>ESOCast</a></li>

<li><a href="https://www.youtube.com/playlist?list=PL81E82E9E956CBDF6" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiUzIRuNNH_xnL9iU6srZsdRwTO2Zx-soIG3tDfADFOhhQwXSMRzUiVYZkjhFeTwgEJtK3ydbqCahhrRrCv6G5Oe7zznJy_05PnMDNL-MP-vlujQh8SnvdnWDnI180jS9CPj72sDdIIfxs/s32-no/hubblecast32x32.png" alt=""/>Hubblecast</a></li>

<li><a href="https://www.youtube.com/playlist?list=PL7B94648201675F66" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiZ1SDeaPENUJiBat5awONhxVX3fM2jsR42QqhAyZpX101b38_mJjtC9HZxlR9JMbgYUjmmaaeUmFS6gCEIRR8oUUTgnWGGrMBisPTWXmlACFeDhjNE9gA2uGwGDAKGkXk1dgWyvmwrx6E/s32-no/" alt=""/>Скрытая Вселенная Спитцера</a></li>

<li><a href="https://www.youtube.com/playlist?list=PL219B5845E3FECE61" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiZ1SDeaPENUJiBat5awONhxVX3fM2jsR42QqhAyZpX101b38_mJjtC9HZxlR9JMbgYUjmmaaeUmFS6gCEIRR8oUUTgnWGGrMBisPTWXmlACFeDhjNE9gA2uGwGDAKGkXk1dgWyvmwrx6E/s32-no/" alt=""/>Спроси Астронома</a></li>

<li><a href="http://www.nebulacast.com/search/label/eClips" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgLDoVGSRZEoIzDeph3uuEfM00Yu95l6qACGS9k8h99Gl7SLQ2JqiOsZWpbaN8rqHwlFrBHj0qQgOvZZJoSuJOyBjzi1R0KSlrsIOg1fF6lVaWg9UUXtHMxARrLhmG8wSHb1mL-tsdSJmhc/w32-h26-no/" alt=""/>NASA/eClips</a></li>



</ul></li>

<li><a><span><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6C2_NJh7ndia2ADy7ymnBadX0t58ipBOeN86ofoN6Q5Uxf2sefdmneA16ngjxft0yYKtJTQpfWuW2WXtOg1i629C2_pWu7X8DmntZu_1mlpwe4KtyMWjENTuT6ePU39toinvLJNuWEKXnGfYIRc98LNoqwV3UaL66E8wrfqPsw9Xzpg3vpHQY4aV31uU/s33/crab_32.png" alt=""/>Темы > </span></a>
<ul>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqlg-HStSFGFrGnKzhsfGcAX" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiXyBtuRDG2tvg5QBhzvq31Dxrmlhxnf5riXncOAu2hOB4ukPfJplBWZlSDeezVIlTNcp0XJEdAhETdCkUFvObN7qnIzfsvgS5dIzpqVhLQoofoMXdZxYpW9U9gYlQaqk5cSKfuIdlbRPU/s32-no/" alt=""/>Космология</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqndl94g9sL9zlSZgBY-Nc0s" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiXyBtuRDG2tvg5QBhzvq31Dxrmlhxnf5riXncOAu2hOB4ukPfJplBWZlSDeezVIlTNcp0XJEdAhETdCkUFvObN7qnIzfsvgS5dIzpqVhLQoofoMXdZxYpW9U9gYlQaqk5cSKfuIdlbRPU/s32-no/" alt=""/>Галактики</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqkKbLTssc7NSwuhUwKcahuU" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj5P8qYtw9S2QF5pVw27HvHkZfmBizW5LFwNJp5K-tSoHzoVLmAaKuhrYwsjfIOY9YqzQnXgqj0Ri2vbJuKw_u6FcdZzQWXxS36AC4CpXP9UhyphenhyphenurNGnILAdXG3lEsVmQbryIoaPhcrArmY/s32-no/jupiter32x32.png" alt=""/>Экзопланеты</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqnJCQhXx18tUOxSeVtyfpD8" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijRG53qXVaZgQy8UEwzkJ54MVW5D1yIhVBIP72ihzUdQBjlaqFKpwXNcfWXasn6DnOCd8F6_c_SvafZbFA30LJJkqt3r3PLXv0qaOFoGS4wK1PMilzudR5r5JgkV8Wr1ZbXooSFygJfmg/s32-no/sun32x32.png" alt=""/>Звезды</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplql-oXn86sv6JtdO31_gIl5Z"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijRG53qXVaZgQy8UEwzkJ54MVW5D1yIhVBIP72ihzUdQBjlaqFKpwXNcfWXasn6DnOCd8F6_c_SvafZbFA30LJJkqt3r3PLXv0qaOFoGS4wK1PMilzudR5r5JgkV8Wr1ZbXooSFygJfmg/s32-no/sun32x32.png" alt=""/>Солнечная система</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqnVzn3vlyRyKAA-26sPyMld" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijRG53qXVaZgQy8UEwzkJ54MVW5D1yIhVBIP72ihzUdQBjlaqFKpwXNcfWXasn6DnOCd8F6_c_SvafZbFA30LJJkqt3r3PLXv0qaOFoGS4wK1PMilzudR5r5JgkV8Wr1ZbXooSFygJfmg/s32-no/sun32x32.png" alt=""/>Солнце</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqn8pnbKjoRKx182tp-uS7oy" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhKRp_xKbITPayaiQOMUTX2WrmQF1-Y9bdz9kaqaLIjmHh1as0ntkxmOU5zdUFhKuVmzNeKFOSFvYVZYCXd4O1BlL54EiUL43CsI4TNhqn3PGt48SSvkkCiDkTb33tPWa12HHjk4JI1Utc/s32-no/rosetta32x32.png" alt=""/>Розетта</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqktwdoDkBf_x63JvE35rd08" target="_blank"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpf5ajGXQpp8Xept2oyOk4C913cTj9OK7Il1vxAZJYBxXA_Te8Wy0WzHQXZ-pGVVZjXfoJmZYaMHbu5qaFi68Lnk-i8ASxi_AKobuwpymQfRQByNbNE2NA95ybB9lpTrQJQxzrlkxzCrY/s32-no/kids32x32.png" alt=""/>Космос - детям</a></li>
</ul></li>

<li><a><span><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjh6a9qXCOxluFWMJHLxIxBcjVVouQgOXFLeoPXGCd7d-b7sK6z7pJSZkQfF6YUS7dcweVdQfLA-VOkzFoJ0do9u51-87vRrKoN2X5aLM_DnF9OV8ngGpHFOjKi70nqylBs9TH3K0Iq7_8/s32-no/" alt=""/>DVD > </span></a>
<ul>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqnU5LcdAWDubjpgbqQyVVJD"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjh6a9qXCOxluFWMJHLxIxBcjVVouQgOXFLeoPXGCd7d-b7sK6z7pJSZkQfF6YUS7dcweVdQfLA-VOkzFoJ0do9u51-87vRrKoN2X5aLM_DnF9OV8ngGpHFOjKi70nqylBs9TH3K0Iq7_8/s32-no/" alt=""/>Взгляд в небо</a></li>

<li><a href="https://www.youtube.com/playlist?list=PLTwmObcoplql-vdRVR8SHaLUtDG-ZbMp9"><a href="https://www.youtube.com/playlist?list=PLTwmObcoplqnU5LcdAWDubjpgbqQyVVJD"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjh6a9qXCOxluFWMJHLxIxBcjVVouQgOXFLeoPXGCd7d-b7sK6z7pJSZkQfF6YUS7dcweVdQfLA-VOkzFoJ0do9u51-87vRrKoN2X5aLM_DnF9OV8ngGpHFOjKi70nqylBs9TH3K0Iq7_8/s32-no/" alt=""/>Путь к звездам</a></a></li>
</ul></li>

</ul></li>

<li><a><span>📻  Радио > </span></a>
<ul>

<li><a href="http://www.nebulacast.com/p/blog-page_6.html"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj9Sj2ygOqXmvCkhsnZp27T39qf1MIGvv19yZZQCqapi5JJkmeyM3lmW8AcNagNFx7arSgUnwLyYHZkPLJ45LZvbQUQ46-rhxu04vqr6qs-MjiFVbbSoSCQCPSDDNNApUGcgR7ZdEQyHAg/w19-h32-no/" alt=""/>Подкасты</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%97%D0%B2%D1%83%D0%BA%D0%BE%D0%BF%D0%B8%D1%81%D1%8C"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj9Sj2ygOqXmvCkhsnZp27T39qf1MIGvv19yZZQCqapi5JJkmeyM3lmW8AcNagNFx7arSgUnwLyYHZkPLJ45LZvbQUQ46-rhxu04vqr6qs-MjiFVbbSoSCQCPSDDNNApUGcgR7ZdEQyHAg/w19-h32-no/" alt=""/>Звукопись</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%91%D1%80%D0%B5%D0%B4%D0%B1%D0%B5%D1%80%D0%B8"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhMDbT9x2xveE2_rGUi1X0m8KM-3m6p5eYxHXoZXofmzujnSTyvo8v_SbGEKtPeuwrEAaKK4lCwfXmPrctPr06sslfEo4lRjeiK8KAfFIV43kdguuDVrRDaRm7j3wBuFXbWO5xTqFSsji0/w32-h49-no/" alt=""/>Читаем Бредбери</a></li>
</ul></li>

<li><a><span>📷 Фото > </span></a>
<ul>

<li><a href="http://www.nebulacast.com/search/label/%D0%A4%D0%BE%D1%82%D0%BE%20%D0%B4%D0%BD%D1%8F">📸  Фото дня</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%90%D0%BD%D0%B8%D0%BC%D0%B0%D1%86%D0%B8%D0%B8">🤖  Анимации</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%90%D1%81%D1%82%D1%80%D0%BE%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D1%8F">📸  Астрофотография</a></li>

<li><a href="http://www.nebulacast.com/search/label/3D%20%D0%92%D1%81%D0%B5%D0%BB%D0%B5%D0%BD%D0%BD%D0%B0%D1%8F">🌐  3D Вселенная</a></li>
</ul></li>

<li style="list-style:none; padding:0; margin:0;">
    <span class="divider"></span>
</li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9F%D0%BE%D1%8D%D0%B7%D0%B8%D1%8F%20%D0%BA%D0%BE%D1%81%D0%BC%D0%BE%D1%81%D0%B0">📚  Поэзия космоса</a></li>
</ul></li>

<li class="topmenu"><a href="#" style="height:18px;line-height:18px;"><span>Вселенная</span></a>
<ul>

<li><a><span>До 1 парсека >
<ul>

<li><a href="http://www.nebulacast.com/search/label/%D0%A1%D0%BE%D0%BB%D0%BD%D1%86%D0%B5"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijRG53qXVaZgQy8UEwzkJ54MVW5D1yIhVBIP72ihzUdQBjlaqFKpwXNcfWXasn6DnOCd8F6_c_SvafZbFA30LJJkqt3r3PLXv0qaOFoGS4wK1PMilzudR5r5JgkV8Wr1ZbXooSFygJfmg/s32-no/sun32x32.png" alt=""/>Солнце</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9C%D0%B5%D1%80%D0%BA%D1%83%D1%80%D0%B8%D0%B9"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj6XFMfIS3TASo0teMe4KhQQcyUcTo8jz3WZ_A6Ctp3TH3uB8_OGI6jC_sSPcVV3bMXhuE4_1qzdc_UyZqv5MoZJsR7PtBPUdtxkaF4xeKUADsVyuAVQ_wje0GxhquLiR1aliVur9-zoPmfQWV1Bai6Q0aVAJcRHcYdsu-KPv59Sx-Ms8tDpCA5COaz-Fo/s33/Mercury.png" alt=""/>Меркурий</a></li>

<li><a href="https://www.nebulacast.com/search/label/Венера"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgCT_pazXdv9a390KNFJAY1uuwlY9rUwvS0AWZI84iFBfWZDXG6nGx9ZrgbwRtgwZ2LAbuSR6KMAIsoNH3prV7jxJgH1KEBmneCqmuR9i3YEOieinY8dBGybpwm72sB2ifCz0naWh_wuzB9uH6Ba_ZKte_n2ePcKY2CzIoqFa6HMlk2oprDA6zj5Ba7ELM/s32/Venus.png" alt=""/>Венера</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9B%D1%83%D0%BD%D0%B0"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi73lKUMq5KpCmhvZQOhj0veNN7c5H4OwEX00ux7ot_Lctc12m4VFHSeMcClm2IliZcQFAhW4y_JqXX9QmHTnfnsCN0EaqXRdI0-M1KsYgoLSPmpoUTd-nSnbVHPfw0JOojLIC39sYn3myIRr2fgpGtvHsr-ZdsCVoToRilCxwtgI_hwxqoZw84qzhpUw4/s32/Moon.png" alt=""/>Луна</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9C%D0%B0%D1%80%D1%81"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzkv8rQZlY4Jm20RQJp22mDaRRCkc1kwWNI_mQi2PIrZhAG7xRUUSPwFpbxrcrX-olasg2DfCd_xDE-eG-no8I-NYrD15JGbaSri9cU42mpvcafrXrLxHCGtCKAcMMmrgPO6ACF5VatbCTAM7h9BohNhilZvKBiWR1TVfJTVTjQP9tIPRLOLJlPz43CJ0/s32/Mars.png" alt=""/>Марс</a></li>

<li><a href="https://www.nebulacast.com/search/label/Астероиды"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiEzVdEnzdylO92BnlNEFhEHUQSbGymqPOzZfbqNODf9p1OE0VBSCQQ2PGf79x6JCQvdnzn6dLeygojMVQOmAHlMH1-GzT1kUPzIABvuca8Qok0w65muBjs9DsQxmhZxWz6VzoyKXrvDjNCFl-5mvXQnA7sic_rchjWXcCIKpRcdMGRk5FBJkXFWxrpTIY/s39/Asteroid_32.png" alt="" style="width:32px;"/>Астероиды</a></li>


<li><a href="http://www.nebulacast.com/search/label/%D0%AE%D0%BF%D0%B8%D1%82%D0%B5%D1%80"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjAoKThwXwt6rRvRpLwVNyl_TB_DlGRblYerzWMHYbIqBzUZQsxSEwgT3kQsUWjQ08XPXzDmYbI3hpedzHkhkqhwxCv4aN7DQK9KmX3_SXHCr0lfZ2dsqnGwa8-vJUAMTkzo_ArgbTHo8KG9HtJk71TBQcg_WWw5n5rkhGxK9UwIgdWnnfqaEsaGxpJidA/s33/Jupiter32.png" alt=""/>Юпитер</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A1%D0%B0%D1%82%D1%83%D1%80%D0%BD"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvsnKNjrtLutyAM9BStWcMSxqPKLjj9J1JlIzWaheBF5hg1yCaLRTG6fSZwhC6joUa60bGPAEm8ky6U4iJ-nsQWQytGzQkFMzkDgw82WyWmoEru_2PR18C867T0g0k3j9ShtqjQcYvdseVbQP2DHoV3azJdop2AINeCvMxzZ4TS34kfA_VWbLMMeD3_n0/s41/Saturn.png” alt=""/>Сатурн</a></li>

<li><a href="https://www.nebulacast.com/search/label/Уран"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgrubWOa6jqu0oY9W_zoppi-jwdD6dBWNDi7qUYWBY0mCcx8P77mk4i3SImS89BHt-N6yu-Ay0_5S8M8mTL7syrXLK9U4lppNXahJaiBsn3cZcPvRv4jGPhtL3W76gBVuqYnz87m-eBfz1SOPBPlv-M1lMK7FuT08nBLSxY01crrE_ZBUH9SY7t8DIcAPg/s32/Uranus_32.png" alt=""/>Уран</a></li>

<li><a href="https://www.nebulacast.com/search/label/Нептун"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh0HxdXRbPswgqQPqYGErdmCgc4cqy_QiDWX4AHe9AmMhVTwA-i0LZapeQ8Kb2TSFlDXMQ-ipSmDBoxW41vB0hqf5cVG4TpuGhkSns5oEoHjwlYbVYoMfWPZhqcbamJK7jtQ97t7-NtmgxQHjVC-oaUXu6wtaIbMCb8UnAQCbP-8PJqybEEEp2Vj_-iKgg/s32/Neptune_32.png" alt=""/>Нептун</a></li>

<li><a href="https://www.nebulacast.com/search/label/Плутон"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEii-SyXmJw1ByX-77DatyDqAxSw8TJ_3tCUjLpvKlZY8LsePK4iIv7tveebqC8Aly7JsVJo-RYguxxw5oW-naS7GHsHqQGf-GJOpQ9bhsRHpoN26q9R6P9IvV4CtQ2DaJ0uNN2JE4QJvpZywUrmKBe5Pm00ANtfA2sWh9SUOfzXRPXbG41b1IA7_RD6Lg0/s32/Pluto_32.png" alt=""/>Плутон</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9A%D0%BE%D0%BC%D0%B5%D1%82%D1%8B"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgb4FwB7G-1DvY_ewyHTOjNNbJQOmpwSjxY88_bwfGtgQ3yVFlVkHW3xJAd1TYjX1_EgzcmbTIqT7PrvfuXs7pdug-rVwpSk2_esetshphxZC8w8tbyLBDizz_xJAPhFDKV2WbgTkNMiqQ/s32-no/comet32x32.png" alt=""/>Кометы</a></li>

<li><a href="https://www.nebulacast.com/search/label/3I%2FATLAS"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgbWMRnMH2ilmYwkhcAIfF6m0v20pt8TMDu3EbJYeODb_NPIQI-0greX9RNUUsQJ3lY4lPq6f7NwmQC6tsofAguPS9JmCIRf2yfU-BXWy0spisf8xfVOyMw9PZf0sEJUALWgibvOHFJ6FBxgUgj2rnMhVFYIlE0Py3L60DDPjtu584EJM3yzDJF2aQ8GSM/s32/ET.png" alt=""/>3I/ATLAS</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A1%D0%BE%D0%BB%D0%BD%D0%B5%D1%87%D0%BD%D0%B0%D1%8F%20%D1%81%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D0%B0" style="height:18px;line-height:18px;"><span>Солнечная система</span></a></li>
</ul></span></a></li>

<li><a><span>От 1 пк до 30 кпк ></span></a>
<ul>

<li><a href="http://www.nebulacast.com/search/label/%D0%97%D0%B2%D0%B5%D0%B7%D0%B4%D1%8B"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgIp2jWuEQMVvVZPPx90H5npM7LkmFHB_RBjclAatTE2ouOYNppxgLXz3jS1hEbqeqnYPy-wwD3wDn7ew__I6JWxxVUdlil0DiABBzmn8aN9ZCAxTJJtKbYMof7UYIcJOIGBhKLs3iid3-5S2Jgx0befimJo7TU2qUoErdtZbkDIbOY4Cefjs9FCse1UGM/s32/star_32..png" alt=""/>Звезды</a></li>


<li><a href="https://www.nebulacast.com/search/label/Красные%20карлики"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg3QgW1ZdSL3_awvxb__DKFe_B98c6IIR-9Bdk6WbNu702fyQF-dNos0NLDXmUN-zBrq__3FcdfsW1n4BVZAgzk9zmiwibI53RroGWU4lCDYI0UMmSPwtxcnaCAkufqCg1XyPsiKaIlHKFstFO-xaXG1oZHkb2oWmVFfbBBXMVg1CEhClbnRHlQo99aHBU/s32/MD.png" alt=""/>Красные карлики</a></li>

<li><a href="https://www.nebulacast.com/search/label/Коричневые%20карлики"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjp0rEhmmaD9l1JXvX5BCcDtA6oaLVlMICc-tjnq_zOOPymW_T8XI3VXVsv8IcuM-w6T2aJxJLYBv7OmT-t4L31CMAuInPJYM_SdggkWx4nggyoJsbN6QdckgHTnPK89ek3HbpkkZIfJuFc9fyScqV30PpNsOj-t1HARJzgt4azRc_DqSeiFhFeAQpOLFs/s32/BD.png" alt=""/>Коричневые карлики</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%AD%D0%BA%D0%B7%D0%BE%D0%BF%D0%BB%D0%B0%D0%BD%D0%B5%D1%82%D1%8B"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2LyHc4LEllS7Rolc_Rs91ih4UTtpCrLuQMw0fqmSosTN7HgluJlKbrjwR2y9eEFLhu2gPrVaiNnBMi9bBxKQLxMZ26sjU32GKA2rd29Qz96lVYNZEj0UsY7lTierslwXvlKATVdcHUaWQZQsCtbqBzkzSvAgONy-FsHFo7Z6ZVKQDRAIiS2hXLnQRfFU/s32/exoplanet_32.png" alt=""/>Экзопланеты</a></li>

<li style="list-style:none; padding:0; margin:0;">
    <span class="divider"></span>
</li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9F%D0%BB%D0%B0%D0%BD%D0%B5%D1%82%D0%B0%D1%80%D0%BD%D1%8B%D0%B5%20%D1%82%D1%83%D0%BC%D0%B0%D0%BD%D0%BD%D0%BE%D1%81%D1%82%D0%B8"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh9L6Q1M79RL5ccvmw_ZROu-IP2ELJy5TMvevxJdXYfuvqGx6nBM6GGl2_dDIkCPtkmrNLw3IODZOrT-eiAp3NsdrXWFYWQb5d6JnJNFxd9TpTikGEdabnXTSEHe5dCFFrEgqQZnRX-qOiORmKLaYJyV9p6jOcsO0SXuPwtLUdRlnMpFZ-KJKsIooBjuaE/s33/Planetary%20nebula_32.png" alt=""/>Планетарные туманности</a></li>

<li><a href="https://www.nebulacast.com/search/label/Белые%20карлики"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiDDK3blrld-BMyJ5Nt8Kn7EEC7kS6C4PIXBgsCB0x_3fBbQrU-Np85qzxNU0up9MQ8Yk4Kx0BUT3JPdXzZPgk1m40_BVcyGXM_jKKXpspx8UBvx2hpqD6A8UQrLn_99LsDYt5iKq_Ep7s512vyPt_vYnr8O38gB_bGr0jmBGqQ7_P8FijrrNCi_q5I-Mg/s32/WD.png" alt=""/>Белые карлики</a></li>

<li><a href="https://www.nebulacast.com/search/label/Нейтронные%20звезды"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkfgkPh94g-Dbd3EKuHfaBfdczr5mJFFcHXHugTGf1iolS2bPSBWY8JtjVKbFTtplTkPYXHVKZ-ZV0Dp-QPIDcXJ9hIVwNkb0lcOs06-ZFouSSKSwGm0JKU7eiDKk52NSud6urxUcyRU7KxTBfNuc2GAbxOstOYSSCPxgy7IhaA1hXA9kwubH9OVdVTrQ/s33/WD_2.png" alt=""/>Нейтронные звезды</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9F%D1%83%D0%BB%D1%8C%D1%81%D0%B0%D1%80%D1%8B"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg-_buVRJvQ1tHal7-Twb2RzZq87-LAkCkp3nl54wAEjlBHfsbU0Nt_xGUYU-UpZi9OXr6CXk4NK1csQSW9V04W8wseBZxCxCtmbuqK5eD2mPSl5GRjvwI_hhO7-AyEOUp_NGFUjWkUBEayOBCn-ddxLsnxQ89DTnXgVAWUGbBPaDDBBmEkUvVN5S5JXVY/s33/Pulsar_32.png" alt=""/>Пульсары</a></li>

<li style="list-style:none; padding:0; margin:0;">
    <span class="divider"></span>
</li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9C%D0%BB%D0%B5%D1%87%D0%BD%D1%8B%D0%B9%20%D0%9F%D1%83%D1%82%D1%8C"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiT3RLD3LAUxTA0xG8b8gTBdqPJDwGZA5VyPfbOFmUqzhzA1maz5pE-N3IyYKgGrnhyc83hU3mqwnCDoU4xNZcbq4YZgrQOZGXGWsk8wxefr9r4k2o9Q8l56Ne_bRK_JuejAkCogrlBQWUAbbMyHi7ll5VHG_djkWsf-uWHV3AsYBczpWT3ElwOgPQsfPo/s33/MW.png" alt=""/>Млечный Путь</a></li>
</ul></li>

<li><a><span>Больше 30 кпк ></span></a>
<ul>

<li><a href="https://www.nebulacast.com/search/label/Черные%20дыры" alt=""/><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgIyhNTIm9AJUQGpNOmqa0bpQEs4d7PK9zyKiQH04s_GIPG2dfCOpC2A0QhEhLtU4JG6g8SFQ1JIZTobnS0jo4u_AU8c0ei71Stb-35Q2-N3RW0zz77dlghvnvdTYWKcqWrC_bAkVlmFH-qq2_eHtCk-IwnBWT4pIBOAzNbhmunezd2at4nKk12F9C0hFA/s33/BH_32.png" alt=""/>Черные дыры</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A1%D0%B2%D0%B5%D1%80%D1%85%D0%BD%D0%BE%D0%B2%D1%8B%D0%B5"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEitKarE4s9tGJMBcOt46Pq_rNgFEFjsmTNlXqhaDA8a5d0cT9z-V4t-8emvJUCX6dnaZCHnzdNfj2ayj39x7I_5Nx2Dd7Y-BiKh2ZDZphBrJX-NoeizyUCmUDsjloG9JmhXvF0FpDLntb2yZjpx7_HI-Te6o6Uw9W3lEn00c6GUHMJzXCTCRfZO_NFsLfY/s33/Supernova.png" alt=""/>Сверхновые</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%93%D0%B0%D0%BB%D0%B0%D0%BA%D1%82%D0%B8%D0%BA%D0%B8"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiT3RLD3LAUxTA0xG8b8gTBdqPJDwGZA5VyPfbOFmUqzhzA1maz5pE-N3IyYKgGrnhyc83hU3mqwnCDoU4xNZcbq4YZgrQOZGXGWsk8wxefr9r4k2o9Q8l56Ne_bRK_JuejAkCogrlBQWUAbbMyHi7ll5VHG_djkWsf-uWHV3AsYBczpWT3ElwOgPQsfPo/s33/MW.png" alt=""/>Галактики</a></li>


<li><a href="https://www.nebulacast.com/search/label/Квазары"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgeYxKbky3pbSQRb4ykWVIsJ7jiuYpjeLQ_8T07GNYfksp8e0A55-d6eX_RBEGQfCQ-2i-EPUNb6Ze7mF-iIMhXcXH9g_vTmqgDT5nZQ01cyCXBrWlQFpBZt8k9rAdXa88W66qjP3GZhnOCGcXcF2KZAjEDl-prubHl_OjSrHltxCoTMawp3gKE2zFNBVw/s34/Quasar_32.png" alt=""/>Квазары</a></li>


<li><a href="http://www.nebulacast.com/search/label/%D0%93%D1%80%D0%B0%D0%B2%D0%B8%D1%82%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%BD%D1%8B%D0%B5%20%D0%BB%D0%B8%D0%BD%D0%B7%D1%8B"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhSZUs61gFAay2Gz_iX-hznkMzjL8Wq2ToB3BDNj2PBKhrccKjkV32NWIloUbppD3zN_WlJcXxyLEGNKvAJL7ZN4QKeRAYVb_zAlr4pd8ZAQl0xf7ogeBLIsfyKNqFZAgP4owFqSszgkUVeHp4oE68brmFxKpNRgYgkbXU-2fJ1fG08GMqsGf6UzwkKiaY/s32/Lens_32.png" alt=""/>Гравитационные линзы</a></li>

<li><a href="https://www.nebulacast.com/search/label/Гравитационные%20волны"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiGz3eBrkDLVz5_W-ZbjclHHI1XBNr7LI8Tf1JaZmnD46v8NG86XxFpFbmbOkznjXu5mfftQY46WzPKy-o6uLfarT_VzXDEcIT-1ZzexHCiQgXdPwNDci3P-fHa-Ke_vaebqxu54EH8DuWA7KTccudQfZ_Opf68WQ9e8d8vw5gzC1zX7Z6XmcLaGVWQQJs/s33/Wave_32.png" alt=""/>Гравитационные волны</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A2%D0%B5%D0%BC%D0%BD%D0%B0%D1%8F%20%D0%9C%D0%B0%D1%82%D0%B5%D1%80%D0%B8%D1%8F"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjzQftueB74xaxrmUnHlcPp2U6uJainNcKqvKhPXpP1kuRsfKqS5_B6DgSzf6nTwG2CoolHN4FS7HevRHnwJ4uXXdnRrmfwYcRkAFrtG4LlT7H9ICSZ1TZqNq_eCe7deuCCC-ioZqb3wLLy5Vl_djS9g5UlixSV4W-7KeJeK4HIM3HEClY_6ywGY6XBs8k/s34/Halvorsen32x32.png" alt=""/>Темная материя</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9A%D0%BE%D1%81%D0%BC%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D1%8F"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgIp2jWuEQMVvVZPPx90H5npM7LkmFHB_RBjclAatTE2ouOYNppxgLXz3jS1hEbqeqnYPy-wwD3wDn7ew__I6JWxxVUdlil0DiABBzmn8aN9ZCAxTJJtKbYMof7UYIcJOIGBhKLs3iid3-5S2Jgx0befimJo7TU2qUoErdtZbkDIbOY4Cefjs9FCse1UGM/s32/star_32..png" alt=""/>Космология</a>
</li></ul></li>


</ul></li>

<li class="topmenu"><a style="height:18px;line-height:18px;"><span>Исследования</span></a>
<ul>

<li class="topmenu"><a style="height:18px;line-height:18px;"><span>Из космоса ></span></a>
<ul>

<li><a href="http://www.nebulacast.com/search/label/JWST"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiiip-ZnmQbeMwOd3ebQvtb5ffvBqHOoRwp29t0pBinRfnvAgqCr0PuiVntrul-8a0Q18sG1AjznYtWYUGsG-lIYCdCwYE__-Lzj92jAefjOBVrjeR5Fu2ATgmMH-kfUTLER22ASj2-bRI/s32-no/jwst32x32.png" alt=""/>JWST</a></li>

<li><a href="https://www.nebulacast.com/search/label/eROSITA"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjIm3AaGh8sK3LBgOzVhLLpXgoyRYMBN3A2owpAUar8p_ooWrYnTW5ZitPVVBCOw1y9sv4bMsl7WIQCUF_ZJcc93ZzbSnoGEXvllE2Zhrg59V8NxKicj6tEuF1ZurcBvxevHeD87kLWk454UffmlyJkEdXsK6qRE0yOJP2l1jm5LXtv0KDkrVYrw-n-ejE/s43/Spektr-RG_2020_stamp_of_Russia.png" alt=""/>eROSITA</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A5%D0%B0%D0%B1%D0%B1%D0%BB"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjvvbNcbn0awMH5tg4kOyKk2rAw5OxoanHwLGGd_01_XmBzfQSHsLoTjPoaBtXDneERApNh42fLo5h71D041aE6Ncps10RBZaZXOpRuxOVYYB8jTZKCsjCNxVMZI-9JzDDE6bRhKPuM74U/s32-no/hubble32x32.png" alt=""/>Хаббл</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A7%D0%B0%D0%BD%D0%B4%D1%80%D0%B0"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEipN06cmw6TlTMJMcqKsC0EM5AtWG6KDDAvpkGT193ubWCCAya2Dr6gupUh2fMwhEYy6Bkz7XNdDFLUdaIArwTDlhAK85jmfGadGp53owahPGmvWYqyfe1knNNJkAtyPDaus3S9zu31DpU/s32-no/chandra32x32.png" alt=""/>Чандра</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A4%D0%B5%D1%80%D0%BC%D0%B8"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiPTJdvFnwHD15f9JtNNYeLRgT2KleIIrTd_TpxHECeh3uvMj03es2dEjt1jaY214C6E9P6-Qy1LIOiGRAxSCQL3iH0pHAZvqdbZ1lu30qT4uITepIo0fN05OR18wz5GRh2eqwSy4G7xdg/s32-no/fermi32x32.png" alt=""/>Ферми</a></li>

<li><a href="https://www.nebulacast.com/search/label/TESS"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhteFQ_x4McX4UTX0_i6gXEIKlGA0sBENnm-1_YaTN2vKhK0_PG9JP9W-HFGjrAjSVZySjM5pGShYca9h0yixBGOXIK_JTLvZtrDY9m0aNscfsNz146HlHOmyC1gm8nJ7HuqIFE38t44Nkw0jpODZRcGYhu_wACCrmXd3dZAlo1Q92_Mv1M03xkNxdCnAI/s45/TESS_32.png" alt="" style="width:32px;"/>TESS</a></li>

<li><span>--------</span></li>

<li><a href="https://www.nebulacast.com/search/label/Roman"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTSyiQph1eyJP4wlYMEKvYrRutwOWYHCYmbaa1jGLn0m7agY00me6umsP4bjo8DY_VHtQde9SGd43-YLvl4KPG7kshNJ5uxvJ_QVMe_YfzMN-77yR1HphosgJVh-lqfqhPf2UwY5iMs77hQCChgurTQM69HM3TTs8LWU4A0NTc2l1d8c3y5zO8XSAJC8Y/s57/Roman_32.png" alt="" style="width:32px;"/>Роман</a></li>

<li style="list-style:none; padding:0; margin:0;">
    <span class="divider"></span>
</li>


<li class="topmenu"><a style="height:18px;line-height:18px;"><span>Неактивные ></span></a>
<ul>

<li><a href="http://www.nebulacast.com/search/label/GAIA"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiusHj17iYCfedcEcbncfv33JQxBBrhPA3qRTWMS9nfVb03GjDAh2bkCnVZnXIj1ry6AlCqDO_l-q4vXC4O47DBpuzOMoYUvDknASNu3X5kgGdE2_W9cWt4aqFIJaV4_6awnMHFUbv0PE0/s32-no/gaia32x32.png" alt=""/>GAIA</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A1%D0%BF%D0%B8%D1%82%D1%86%D0%B5%D1%80"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpTnV27KcJ-8_NfdXtNvCbweN-61m8Wy-OLPfnUbI5BeZm-hG1fu_e86Xm_Vivm-ab8Bh4Cwxnj8fswTdYDGDOGHi1cIetZ7kmasoVF0_yb5GVc0ssk7wTCsNLI7Lx20jVKEhstOX9MM0/s32-no/spitzer32x32.png" alt=""/>Спитцер</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9A%D0%B5%D0%BF%D0%BB%D0%B5%D1%80"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2ozWF4J8ZuWn1GhrHGpHLPKyz99dFGVnnsDHS5G26Y_jHUiawgro3VV__T5HtcVFc5ggKyju7LxuB7FBnWd0cB89Bk42hvStKsyOUkudfqjS-vP90a91ijsEZa20dsO64uLXUimN9k_I/s32-no/kepler_space_telescope32x32.png" alt=""/>Кеплер</a></li>

<li><a href="http://www.nebulacast.com/search/label/WISE"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgJwyx_dxe1vAuIPPeHgRiaCPHBcIOQG8fnCqpBq9YBT_TOfTYmoGc6RxASZQ3s27Va7jOO_UKeOhZbaxWftcntocr8lpEVGhyphenhyphenlx3MCh7jOfKMURzg4YwgpW6WDpYtvPsZTCz3HN-qg6-M/s32-no/wise32x32.png" alt=""/>WISE</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9F%D0%BB%D0%B0%D0%BD%D0%BA"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhaFYUHRpF3tYw5-BqzAdHaxcimLYIzCMTg6w_y3eRfRxWo0WU_GZF7Zm4waIUSjtFq8m_xSyTKcfqLztaoJxCkpEF2zeuV0ZEXTC2tcy2-mnSzoZ5NNH7Lc6J31L7LGxckIEuHDjFdHXI/s32-no/planck_satellite_32x32.png" alt=""/>Планк</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A1%D0%B2%D0%B8%D1%84%D1%82"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgDpsPjrueSowrx51mJeL9V_rBm9IiABC4wI_yHO9K9u5kEiC3nZGwe1QTTfPAIIuGM5ZrTbIuGWB0rxrUO0Q-BvHKD4tdixf4PrUDv_AwnDep8k6JMFYc0gJ8n9t_L1m9NpK6FTxnKZsg/s32-no/swift32x32.png" alt=""/>Свифт</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9D%D0%BE%D0%B2%D1%8B%D0%B5%20%D0%93%D0%BE%D1%80%D0%B8%D0%B7%D0%BE%D0%BD%D1%82%D1%8B"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEguCD2I1Nd2hDb-DRA5OjCkub3HeYReWtAsjR9pi_GebTGga3ykisrUB-kwn2khKcYpb3LbK4HFRtA8r7Hu4LubNO4PkIaevrm7YVBeihjjLV1v69bkDi37XWoiEjoFaaeib_SUOutzqOk/w32-h30-no/" alt=""/>Новые Горизонты</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A0%D0%BE%D0%B7%D0%B5%D1%82%D1%82%D0%B0"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhKRp_xKbITPayaiQOMUTX2WrmQF1-Y9bdz9kaqaLIjmHh1as0ntkxmOU5zdUFhKuVmzNeKFOSFvYVZYCXd4O1BlL54EiUL43CsI4TNhqn3PGt48SSvkkCiDkTb33tPWa12HHjk4JI1Utc/s32-no/rosetta32x32.png" alt=""/>Розетта</a></li>
</ul>

</li></ul></li>

<li class="topmenu"><a style="height:18px;line-height:18px;"><span>С поверхности Земли ></span></a>
<ul>

<li><a href="http://www.nebulacast.com/search/label/VISTA"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5qe9xkd40ZVIHAfwB_2UWzPj60zTL3sEvVBnPZ8zEXz0QdeDX19UnhC2kbbBbC57OdMnT0qp7hWuTrk8z93vjRi8NACh1YGkzLGWeY0-ZZKHfY4cskmuSR_Kbkf7Zio-G5EjDttifnrFnHdLqV0HxbJ8rVKYI1SP6c-tpDM9o27j_k-TsYs1RMdTtAn0/s36/VISTA_32.png" alt="" style="width:32px;"/>VISTA</a></li>

<li><a href="https://www.nebulacast.com/search/label/LSST"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhXdrcaNKbeZmSL2oIqF7_WlCIAgWf-u4Y6irwpJ0RA0DITZfwpjOJe2oc-oe7wJrk-lNIzJ5QqqAPIHuqHW7ElntPHAEanB6ztUi-Bzq4rKJOxkBA_lgYCztJh_9PM5kMjxyaLro3WD0AUp33iicfayhO2f58f_4O7Oa1v9XEgg0e_pxAmvABbvokUOxg/s32/VLT.png" alt="" style="width:32px;"/>VLT</a></li>

<li><a href="https://www.nebulacast.com/search/label/LSST"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_Qrl-KSvt8CmP0-zEi7UtbIWQPLlIV0hIMti4dmh-Uh9UGBilHSELDaiZ3Mowu8TrWri3rb01ty9JHTaq45JvktROroDKfNXc5RxEcfiY04aqMUeTiTbCld7zonwx6XU4GU5T_sfFwQBpBMyanynTqFMohJnQzIyYhy8PueG3X0VVaLx9Dxeys_afVfA/s40/LSST_32.png" alt="" style="width:32px;"/>LSST</a></li>

<li><a href="https://www.nebulacast.com/search/label/ELT"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfanch7wOwOa5T_LFEsZkK7rsLKhgM3GwZ_pfUJmO4OWbz2I3wnl8BVBcWKmvqTBaFOEk1VS8sZ9YsBtYTh72j6JoDHdwzcVJG5xpdJxE6Dz_YZUcQ6GXhcL3qn2ychH6A_o0PaQAuMGDxQd8b7c-eB9Rbn1WLWhN38QE4vUgowdG17l8GXtmldQqZXjQ/s32/ELT_32.png" alt=""/>ELT</a></li>

<li><span>--------</span></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9A%D0%95%D0%9A"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgDhV2p-J86IU1xjQjW3iHx1nrnyjySlt1v4TKJuS4jrwrjGsLYO8Bhe9SIpy1ow5WBrPq0yZSlnEemf0i3vv0ZL5Tk3LAqvDsOGQwBqoiLeu5noeIW7buJA3Q-VP3z0ZkNzVqcVUmtH98/s32-no/w_m_keck_observatory.png" alt=""/>Кек</a></li>

<li><a href="http://www.nebulacast.com/search/label/CFHT"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiMc3ulIXFRVoDj4i09aY-uZ5LVR7NpjPdfn46qhDimQFAnEm0enx9cusL8-IYgewZSOGuEu1rMCFLBIz8my7W5ajeJhusKIpgqUXsfSVqiYmXTK2L91pCGe2DxiNkM8VJR4OZplKPqrZg/s32-no/cfht-logo.png" alt=""/>CFHT</a></li>
</ul></li>

<li class="topmenu"><a style="height:18px;line-height:18px;"><span>Организации></span></a>
<ul>

<li><a><span><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhD5hu32B5itjDJnGCbcZEX0GI94Pa_MtG27a2S_iE9TQuc9S99kqMAjHGBMeXKZLVRg-F5D41s5kcsPtJuUj6U9syyrDTwfWpoSj9blK6_mPDgqyTwlHPSxUxYceNszhHGNtx5hX3SZPE/s32-no/eso.png" alt=""/>ESO</span></a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%95%D0%9A%D0%90"><span><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaqM_Ocok8ehZKLgzbnGNMjBSNoXxbp2CS2QOPMFHT-sQaJTrSW8l2n78plcncJmc6JHfTR_6tYa0_NdooXe5K3-oBC8mq-bHS6KdSUBs3Ge-Cfslo8VBefmuL3fbyG14VH8q4tpLhPLY/s32-no/esa32x32.png" alt=""/>ЕSA</span></a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9D%D0%90%D0%A1%D0%90"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgu-N-Df3E7RtuRyC5JKIrXhNcn_IPeBv-IsNa28YU0SPLYh4TUjSP2ezVOnZmrp2gi898dF2jrRDqwqmiyVA6-6qqfGy8eYSTFj8m2UKd7CSGwsPf0UAnb1-H8t8R-r0AePRA7JtrT_Y0/w32-h26-no/nasa.png" alt=""/>NASA</a></li>

<li><a href="http://www.nebulacast.com/search/label/Goddard"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgu-N-Df3E7RtuRyC5JKIrXhNcn_IPeBv-IsNa28YU0SPLYh4TUjSP2ezVOnZmrp2gi898dF2jrRDqwqmiyVA6-6qqfGy8eYSTFj8m2UKd7CSGwsPf0UAnb1-H8t8R-r0AePRA7JtrT_Y0/w32-h26-no/nasa.png" alt=""/>Goddard</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9B%D0%B0%D0%B1%D0%BE%D1%80%D0%B0%D1%82%D0%BE%D1%80%D0%B8%D1%8F%20%D0%A0%D0%B5%D0%B0%D0%BA%D1%82%D0%B8%D0%B2%D0%BD%D0%BE%D0%B3%D0%BE%20%D0%94%D0%B2%D0%B8%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhyturjHneEIkzuhgSSQ54pU1mk40Novy-Xjr7usdgV-ReTSkZ2S_uxiDT2z3YxA3wwxEuzU-A4XaOwJ9LvEXzxi13IzF__oLQhkqTUgBcBhnqZ8Cd11LHy-e2tZdRM_NtcUA0WlS9cfEo/s32-no/jpl32x32.png" alt=""/>JPL</a></li>
</ul></li>
</ul>

<li class="topmenu"><a style="height:18px;line-height:18px;"><span>Звёздный Аттрактор</span></a>
<ul>
      <li><a href="/search/label/Звёздный Аттрактор"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhAEJVqQjR1RY5CfKJVN9GVFF9-DjozJ4gjL5hsJLlTcX0qAIdv-XBiDrxgymU5PJLpcq7AIefjSYrUoIPdorE1orVlezeF211C7tUBlJCujhQuoSxA9meCwX80wwUVn-POFR96mP7YhU8ieEccIw6Srin22ivHjAm1JB9trNBh_jAGV0DdYO85OwZfNNg/s34/CMK2_0_Helmet_1_32.png" alt="" style="width:32px;"/>Вселенная Звёздного Аттрактора</a></li>
      <li><a href="/search/label/Дневник Зейна"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhmj3s0P_hZhWPfVv3V4BQA2xq9PjuHX7K4xga8wlO1zhg6wmLKIY1-284Lwl3nQDiR-CLNWMCVrQlYfQLUXZIWJ8KP4qv-S7LlWshZv47DpLUJwTTsooBXGWWQ7jMIY8eJU1opHOnTYPp8NEstwIemj5PgQvA1tqnt6f1R_E6EGqk4OT5fR-0bIfti_JQ/s32/Zane_0_Zoom_Transparent%20copy.png" alt=""/>Дневник Зейна</a></li>
</ul></li>

<li class="toplast"><a style="height:18px;line-height:18px;"><span>Новости</span></a>
<ul>

<li><a href="http://www.nebulacast.com/search/label/%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D0%B8">📰  Новости астрономии</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D0%B8%20%D1%81%D0%B0%D0%B9%D1%82%D0%B0">🗞️  Новости сайта</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%98%D1%81%D1%82%D0%BE%D1%80%D0%B8%D1%8F">🛞  История</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%92%D0%BE%D1%82%20%D1%82%D0%B0%D0%BA%20%D0%BD%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D1%8C"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhdGIRfG7JdVhF-kM6lhY8yFbSEKJvwPpvBMjqpMDsxAMF8nzqeTTbmM5LqUIEM_bbZlQzt6DQAFJJ5a87kKKJnTgqoFRvpu1N0HZA3OlpySwpl74OHsk8ByMDcQaLUgrc5QpDoTB07wa2P58Brec8Es1211106KVXfnDuDyxpeuX3FZ3fZ5gLa9IYqd2o/s32/1_6_32.png" alt=""/>Вот так новость!</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%9C%D1%80%D0%B0%D0%BA%D0%BE%D0%B1%D0%B5%D1%81%D0%B8%D0%B5"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgg3T1-gdOXIbuehcG8B26G3fiNZ1QFma1xcA1vsZe6aB1u24fG0rRSc6to0YvJntk4j4jfpmdLZkM1yciDgoaNpSeNXW0yPqx-viU3yRSKaTthJlZPlqVrmVn3net2LVYLg20uSZY2BcPkoBjzvtW2_CG4pDBtQJQd1NAAVGilNEhdLD4S0JbQ9QFTz88/s37/Tzar.png" alt="" style="width:32px;"/>Мракобесие</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A0%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D1%83%D1%8E">👍  Рекомендую</a></li>

<li><span class="divider"></span></li>

<li><a href="https://www.nebulacast.com/search/label/Зигель"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEips-h-cLLpumnixwaGr1yK_it8nBZac2gGTCKU7ATx_VI07TW3QhPRTkp-N9eC9t7pN8aIC8UZ-zIoRJQS7wyLIDkmP9p5sqXxTbLXkTBX7T8hr7RoGh0Tv16eAoaLwPLkf3fYdFC_USA/s32-no/siegel.png" alt=""/>Итэн Зигель</a></li>

<li><a href="http://www.nebulacast.com/search/label/%D0%A4%D0%B8%D0%BB%20%D0%9F%D0%BB%D0%B5%D0%B9%D1%82"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjNKMp9ZnrvT_LVckEbDLxRPDG6OuNs0cSZgofSSRu8SpBeK9WEm8fmWnd9U5nNSiwLb5aTP2s5wZT63sHVz4rj8wcCOVi6M3U3oGvNXq7FcPOBh4Jg4CnpSPy1Qh3fg_lV81q789JPdGo/s32-no/phil_plait.png" alt=""/>Фил Плейт</a></li>
<li><a> </a></li>

</ul></li>

<!-- End css3menu.com BODY section -->


</li></ul></div>
<br/>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='Blog1' locked='true' title='Сообщения блога' type='Blog'>
            <b:widget-settings>
              <b:widget-setting name='commentLabel'>comments</b:widget-setting>
              <b:widget-setting name='showShareButtons'>true</b:widget-setting>
              <b:widget-setting name='authorLabel'>Posted by</b:widget-setting>
              <b:widget-setting name='style.unittype'>TextAndImage</b:widget-setting>
              <b:widget-setting name='timestampLabel'>at</b:widget-setting>
              <b:widget-setting name='reactionsLabel'/>
              <b:widget-setting name='showAuthorProfile'>false</b:widget-setting>
              <b:widget-setting name='style.layout'>468x60</b:widget-setting>
              <b:widget-setting name='showLocation'>false</b:widget-setting>
              <b:widget-setting name='showTimestamp'>true</b:widget-setting>
              <b:widget-setting name='postsPerAd'>5</b:widget-setting>
              <b:widget-setting name='style.bordercolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='backlinksLabel'/>
              <b:widget-setting name='showDateHeader'>true</b:widget-setting>
              <b:widget-setting name='style.textcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='showCommentLink'>true</b:widget-setting>
              <b:widget-setting name='style.urlcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='postLocationLabel'>Location:</b:widget-setting>
              <b:widget-setting name='showAuthor'>true</b:widget-setting>
              <b:widget-setting name='style.linkcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.bgcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='showLabels'>true</b:widget-setting>
              <b:widget-setting name='postLabelsLabel'>Labels:</b:widget-setting>
              <b:widget-setting name='showBacklinks'>false</b:widget-setting>
              <b:widget-setting name='showInlineAds'>true</b:widget-setting>
              <b:widget-setting name='showReactions'>false</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main' var='top'>
  <b:if cond='!data:mobile'>
    <!-- posts -->
    <div class='blog-posts hfeed'>

      <b:include data='top' name='status-message'/>

      <b:loop values='data:posts' var='post'>
        <b:if cond='data:post.isDateStart and not data:post.isFirstPost'>
          &lt;/div&gt;&lt;/div&gt;
        </b:if>
        <b:if cond='data:post.isDateStart'>
          &lt;div class=&quot;date-outer&quot;&gt;
        </b:if>
        <b:if cond='data:post.dateHeader'>
          <h2 class='date-header'><span><data:post.dateHeader/></span></h2>
        </b:if>
        <b:if cond='data:post.isDateStart'>
          &lt;div class=&quot;date-posts&quot;&gt;
        </b:if>
        <div class='post-outer'>
          <b:include data='post' name='post'/>
          <b:include cond='data:blog.pageType in {&quot;static_page&quot;,&quot;item&quot;}' data='post' name='comment_picker'/>
        </div>

        <!-- Ad -->
        <b:if cond='data:post.includeAd'>
          <div class='inline-ad'>
            <data:adCode/>
          </div>
        </b:if>
      </b:loop>
      <b:if cond='data:numPosts != 0'>
        &lt;/div&gt;&lt;/div&gt;
      </b:if>
    </div>

    <!-- navigation -->
    <b:include name='nextprev'/>

    <!-- feed links -->
    <b:include name='feedLinks'/>

  <b:else/>
    <b:include name='mobile-main'/>
  </b:if>
</b:includable>
            <b:includable id='backlinkDeleteIcon' var='backlink'/>
            <b:includable id='backlinks' var='post'/>
            <b:includable id='comment-form' var='post'>
  <div class='comment-form'>
    <a name='comment-form'/>
    <b:if cond='data:mobile'>
      <h4 id='comment-post-message'>
        <a expr:id='data:widget.instanceId + &quot;_comment-editor-toggle-link&quot;' href='javascript:void(0)'><data:postCommentMsg/></a></h4>
      <p><data:blogCommentMessage/></p>
      <data:blogTeamBlogMessage/>
      <a expr:href='data:post.commentFormIframeSrc' id='comment-editor-src'/>
      <iframe allowtransparency='true' class='blogger-iframe-colorize blogger-comment-from-post' expr:height='data:cmtIframeInitialHeight' frameborder='0' id='comment-editor' name='comment-editor' src='' style='display: none' width='100%'/>
    <b:else/>
      <h4 id='comment-post-message'><data:postCommentMsg/></h4>
      <p><data:blogCommentMessage/></p>
      <data:blogTeamBlogMessage/>
      <a expr:href='data:post.commentFormIframeSrc' id='comment-editor-src'/>
      <iframe allowtransparency='true' class='blogger-iframe-colorize blogger-comment-from-post' expr:height='data:cmtIframeInitialHeight' frameborder='0' id='comment-editor' name='comment-editor' src='' width='100%'/>
    </b:if>
    <data:post.cmtfpIframe/>
    <script type='text/javascript'>
      BLOG_CMT_createIframe(&#39;<data:post.appRpcRelayPath/>&#39;);
    </script>
  </div>
</b:includable>
            <b:includable id='commentDeleteIcon' var='comment'>
  <span expr:class='&quot;item-control &quot; + data:comment.adminClass'>
    <b:if cond='data:showCmtPopup'>
      <div class='goog-toggle-button'>
        <div class='goog-inline-block comment-action-icon'/>
      </div>
    <b:else/>
      <a class='comment-delete' expr:href='data:comment.deleteUrl' expr:title='data:top.deleteCommentMsg'>
        <img src='https://resources.blogblog.com/img/icon_delete13.gif'/>
      </a>
    </b:if>
  </span>
</b:includable>
            <b:includable id='comment_count_picker' var='post'>
  <a class='comment-link' expr:href='data:post.addCommentUrl' expr:onclick='data:post.addCommentOnclick'>
    <data:post.commentLabelFull/>:
  </a>
</b:includable>
            <b:includable id='comment_picker' var='post'>
  <b:if cond='data:post.showThreadedComments'>
    <b:include data='post' name='threaded_comments'/>
  <b:else/>
    <b:include data='post' name='comments'/>
  </b:if>
</b:includable>
            <b:includable id='comments' var='post'>
  <div class='comments' id='comments'>
    <a name='comments'/>
    <b:if cond='data:post.allowComments'>
      <h4><data:post.commentLabelFull/>:</h4>

      <b:if cond='data:post.commentPagingRequired'>
        <span class='paging-control-container'>
          <b:if cond='data:post.hasOlderLinks'>
            <a expr:class='data:post.oldLinkClass' expr:href='data:post.oldestLinkUrl'><data:post.oldestLinkText/></a>
              &#160;
            <a expr:class='data:post.oldLinkClass' expr:href='data:post.olderLinkUrl'><data:post.olderLinkText/></a>
              &#160;
          </b:if>

          <data:post.commentRangeText/>

          <b:if cond='data:post.hasNewerLinks'>
            &#160;
            <a expr:class='data:post.newLinkClass' expr:href='data:post.newerLinkUrl'><data:post.newerLinkText/></a>
            &#160;
            <a expr:class='data:post.newLinkClass' expr:href='data:post.newestLinkUrl'><data:post.newestLinkText/></a>
          </b:if>
        </span>
      </b:if>

      <div expr:id='data:widget.instanceId + &quot;_comments-block-wrapper&quot;'>
        <dl expr:class='data:post.avatarIndentClass' id='comments-block'>
          <b:loop values='data:post.comments' var='comment'>
            <dt expr:class='&quot;comment-author &quot; + data:comment.authorClass' expr:id='data:comment.anchorName'>
              <b:if cond='data:comment.favicon'>
                <img expr:src='data:comment.favicon' height='16px' style='margin-bottom:-2px;' width='16px'/>
              </b:if>
              <a expr:name='data:comment.anchorName'/>
              <b:if cond='data:blog.enabledCommentProfileImages'>
                <data:comment.authorAvatarImage/>
              </b:if>
              <b:if cond='data:comment.authorUrl'>
                <a expr:href='data:comment.authorUrl' rel='nofollow'><data:comment.author/></a>
              <b:else/>
                <data:comment.author/>
              </b:if>
              <data:commentPostedByMsg/>
            </dt>
            <dd class='comment-body' expr:id='data:widget.instanceId + data:comment.cmtBodyIdPostfix'>
              <b:if cond='data:comment.isDeleted'>
                <span class='deleted-comment'><data:comment.body/></span>
              <b:else/>
                <p>
                  <data:comment.body/>
                </p>
              </b:if>
            </dd>
            <dd class='comment-footer'>
              <span class='comment-timestamp'>
                <a expr:href='data:comment.url' title='comment permalink'>
                  <data:comment.timestamp/>
                </a>
                <b:include data='comment' name='commentDeleteIcon'/>
              </span>
            </dd>
          </b:loop>
        </dl>
      </div>

      <b:if cond='data:post.commentPagingRequired'>
        <span class='paging-control-container'>
          <a expr:class='data:post.oldLinkClass' expr:href='data:post.oldestLinkUrl'>
            <data:post.oldestLinkText/>
          </a>
          <a expr:class='data:post.oldLinkClass' expr:href='data:post.olderLinkUrl'>
            <data:post.olderLinkText/>
          </a>
          &#160;
          <data:post.commentRangeText/>
          &#160;
          <a expr:class='data:post.newLinkClass' expr:href='data:post.newerLinkUrl'>
            <data:post.newerLinkText/>
          </a>
          <a expr:class='data:post.newLinkClass' expr:href='data:post.newestLinkUrl'>
            <data:post.newestLinkText/>
          </a>
        </span>
      </b:if>

      <p class='comment-footer'>
        <b:if cond='data:post.embedCommentForm'>
          <b:if cond='data:post.allowNewComments'>
            <b:include data='post' name='comment-form'/>
          <b:else/>
            <data:post.noNewCommentsText/>
          </b:if>
        <b:elseif cond='data:post.allowComments'/>
          <a expr:href='data:post.addCommentUrl' expr:onclick='data:post.addCommentOnclick'><data:postCommentMsg/></a>
        </b:if>
      </p>
    </b:if>
    <b:if cond='data:showCmtPopup'>
      <div id='comment-popup'>
        <iframe allowtransparency='true' frameborder='0' id='comment-actions' name='comment-actions' scrolling='no'>
        </iframe>
      </div>
    </b:if>

  </div>
</b:includable>
            <b:includable id='feedLinks'>
  <b:if cond='data:blog.pageType != &quot;item&quot;'> <!-- Blog feed links -->
    <b:if cond='data:feedLinks'>
      <div class='blog-feeds'>
        <b:include data='feedLinks' name='feedLinksBody'/>
      </div>
    </b:if>

  <b:else/> <!--Post feed links -->
    <div class='post-feeds'>
      <b:loop values='data:posts' var='post'>
        <b:include cond='data:post.allowComments and data:post.feedLinks' data='post.feedLinks' name='feedLinksBody'/>
      </b:loop>
    </div>
  </b:if>
</b:includable>
            <b:includable id='feedLinksBody' var='links'>
  <div class='feed-links'>
  <data:feedLinksMsg/>
  <b:loop values='data:links' var='f'>
     <a class='feed-link' expr:href='data:f.url' expr:type='data:f.mimeType' target='_blank'><data:f.name/> (<data:f.feedType/>)</a>
  </b:loop>
  </div>
</b:includable>
            <b:includable id='iframe_comments' var='post'>
  <!-- G+ comments, no longer available. The includable is retained for backwards-compatibility. -->
</b:includable>
            <b:includable id='mobile-index-post' var='post'>
  <div class='mobile-date-outer date-outer'>
    <b:if cond='data:post.dateHeader'>
      <div class='date-header'>
        <span><data:post.dateHeader/></span>
      </div>
    </b:if>

    <div class='mobile-post-outer'>
      <a expr:href='data:post.url'>
        <h3 class='mobile-index-title entry-title' itemprop='name'>
          <data:post.title/>
        </h3>

        <div class='mobile-index-arrow'>&amp;rsaquo;</div>

        <div class='mobile-index-contents'>
          <b:if cond='data:post.thumbnailUrl'>
            <div class='mobile-index-thumbnail'>
              <div class='Image'>
                <img expr:src='data:post.thumbnailUrl'/>
              </div>
            </div>
          </b:if>

          <div class='post-body'>
            <b:if cond='data:post.snippet'><data:post.snippet/></b:if>
          </div>
        </div>

        <div style='clear: both;'/>
      </a>

      <div class='mobile-index-comment'>
        <b:include cond='data:blog.pageType != &quot;static_page&quot;                          and data:post.allowComments                          and data:post.numComments != 0' data='post' name='comment_count_picker'/>
      </div>
    </div>
  </div>
</b:includable>
            <b:includable id='mobile-main' var='top'>
    <!-- posts -->
    <div class='blog-posts hfeed'>

      <b:include data='top' name='status-message'/>

      <b:if cond='data:blog.pageType == &quot;index&quot;'>
        <b:loop values='data:posts' var='post'>
          <b:include data='post' name='mobile-index-post'/>
        </b:loop>
      <b:else/>
        <b:loop values='data:posts' var='post'>
          <b:include data='post' name='mobile-post'/>
        </b:loop>
      </b:if>
    </div>

   <b:include name='mobile-nextprev'/>
</b:includable>
            <b:includable id='mobile-nextprev'>
  <div class='blog-pager' id='blog-pager'>
    <b:if cond='data:newerPageUrl'>
      <div class='mobile-link-button' id='blog-pager-newer-link'>
      <a class='blog-pager-newer-link' expr:href='data:newerPageUrl' expr:id='data:widget.instanceId + &quot;_blog-pager-newer-link&quot;' expr:title='data:newerPageTitle'>&amp;lsaquo;</a>
      </div>
    </b:if>

    <b:if cond='data:olderPageUrl'>
      <div class='mobile-link-button' id='blog-pager-older-link'>
      <a class='blog-pager-older-link' expr:href='data:olderPageUrl' expr:id='data:widget.instanceId + &quot;_blog-pager-older-link&quot;' expr:title='data:olderPageTitle'>&amp;rsaquo;</a>
      </div>
    </b:if>

    <div class='mobile-link-button' id='blog-pager-home-link'>
    <a class='home-link' expr:href='data:blog.homepageUrl'><data:homeMsg/></a>
    </div>

    <div class='mobile-desktop-link'>
      <a class='home-link' expr:href='data:desktopLinkUrl'><data:desktopLinkMsg/></a>
    </div>

  </div>
  <div class='clear'/>
</b:includable>
            <b:includable id='mobile-post' var='post'>
  <div class='date-outer'>
    <b:if cond='data:post.dateHeader'>
      <h2 class='date-header'><span><data:post.dateHeader/></span></h2>
    </b:if>
    <div class='date-posts'>
      <div class='post-outer'>

        <div class='post hentry uncustomized-post-template' itemscope='itemscope' itemtype='http://schema.org/BlogPosting'>
          <b:if cond='data:post.thumbnailUrl'>
            <meta expr:content='data:post.thumbnailUrl' itemprop='image_url'/>
          </b:if>
          <meta expr:content='data:blog.blogId' itemprop='blogId'/>
          <meta expr:content='data:post.id' itemprop='postId'/>

          <a expr:name='data:post.id'/>
          <b:if cond='data:post.title'>
            <h3 class='post-title entry-title' itemprop='name'>
              <b:if cond='data:post.link'>
                <a expr:href='data:post.link'><data:post.title/></a>
              <b:elseif cond='data:post.url and data:blog.url != data:post.url'/>
                <a expr:href='data:post.url'><data:post.title/></a>
              <b:else/>
                <data:post.title/>
              </b:if>
            </h3>
          </b:if>

          <div class='post-header'>
            <div class='post-header-line-1'/>
          </div>

          <div class='post-body entry-content' expr:id='&quot;post-body-&quot; + data:post.id' itemprop='articleBody'>
            <data:post.body/>
            <div style='clear: both;'/> <!-- clear for photos floats -->
          </div>

          <div class='post-footer'>
            <div class='post-footer-line post-footer-line-1'>
              <span class='post-author vcard'>
                <b:if cond='data:top.showAuthor'>
                  <b:if cond='data:post.authorProfileUrl'>
                    <span class='fn' itemprop='author' itemscope='itemscope' itemtype='http://schema.org/Person'>
                      <meta expr:content='data:post.authorProfileUrl' itemprop='url'/>
                      <a expr:href='data:post.authorProfileUrl' rel='author' title='author profile'>
                        <span itemprop='name'><data:post.author/></span>
                      </a>
                    </span>
                  <b:else/>
                    <span class='fn' itemprop='author' itemscope='itemscope' itemtype='http://schema.org/Person'>
                      <span itemprop='name'><data:post.author/></span>
                    </span>
                  </b:if>
                </b:if>
              </span>

              <span class='post-timestamp'>
                <b:if cond='data:top.showTimestamp'>
                  <data:top.timestampLabel/>
                  <b:if cond='data:post.url'>
                    <meta expr:content='data:post.url.canonical' itemprop='url'/>
                    <a class='timestamp-link' expr:href='data:post.url' rel='bookmark' title='permanent link'><abbr class='published' expr:title='data:post.timestampISO8601' itemprop='datePublished'><data:post.timestamp/></abbr></a>
                  </b:if>
                </b:if>
              </span>

              <span class='post-comment-link'>
                <b:include cond='data:blog.pageType not in {&quot;item&quot;,&quot;static_page&quot;}                                  and data:post.allowComments' data='post' name='comment_count_picker'/>
              </span>
            </div>

            <div class='post-footer-line post-footer-line-2'>
              <b:if cond='data:top.showMobileShare'>
                <div class='mobile-link-button goog-inline-block' id='mobile-share-button'>
                  <a href='javascript:void(0);'><data:shareMsg/></a>
                </div>
              </b:if>
            </div>

          </div>
        </div>

        <b:include cond='data:blog.pageType in {&quot;static_page&quot;,&quot;item&quot;}' data='post' name='comment_picker'/>
      </div>
    </div>
  </div>
</b:includable>
            <b:includable id='nextprev'>
  <div class='blog-pager' id='blog-pager'>
    <b:if cond='data:newerPageUrl'>
      <span id='blog-pager-newer-link'>
      <a class='blog-pager-newer-link' expr:href='data:newerPageUrl' expr:id='data:widget.instanceId + &quot;_blog-pager-newer-link&quot;' expr:title='data:newerPageTitle'><data:newerPageTitle/></a>
      </span>
    </b:if>

    <b:if cond='data:olderPageUrl'>
      <span id='blog-pager-older-link'>
      <a class='blog-pager-older-link' expr:href='data:olderPageUrl' expr:id='data:widget.instanceId + &quot;_blog-pager-older-link&quot;' expr:title='data:olderPageTitle'><data:olderPageTitle/></a>
      </span>
    </b:if>

    <a class='home-link' expr:href='data:blog.homepageUrl'><data:homeMsg/></a>

    <b:if cond='data:mobileLinkUrl'>
      <div class='blog-mobile-link'>
        <a expr:href='data:mobileLinkUrl'><data:mobileLinkMsg/></a>
      </div>
    </b:if>

  </div>
  <div class='clear'/>
</b:includable>
            <b:includable id='post' var='post'>
  <div class='post hentry'>
    <a expr:name='data:post.id'/>
    <b:if cond='data:post.title'>
      <h3 class='post-title entry-title'>
     <b:if cond='data:post.link'>
       <a expr:href='data:post.link'><data:post.title/></a>
     <b:else/>
        <b:if cond='data:post.url'>
          <a expr:href='data:post.url'><data:post.title/></a>
        <b:else/>
          <data:post.title/>
        </b:if>
     </b:if>
      </h3>
    </b:if>

    <div class='post-header-line-1'/>

    <div class='post-body entry-content'>
      <data:post.body/>
      <div style='clear: both;'/> <!-- clear for photos floats -->
    </div>

    <div class='post-footer'>
    <div class='post-footer-line post-footer-line-1'><span class='post-author vcard'>
        <b:if cond='data:top.showAuthor'>
          <data:top.authorLabel/>
          <span class='fn'><data:post.author/></span>
        </b:if>
      </span> <span class='post-timestamp'>
        <b:if cond='data:top.showTimestamp'>
          <data:top.timestampLabel/>
        <b:if cond='data:post.url'>
          <a class='timestamp-link' expr:href='data:post.url' rel='bookmark' title='permanent link'><abbr class='published' expr:title='data:post.timestampISO8601'><data:post.timestamp/></abbr></a>
        </b:if>
        </b:if>
      </span> <span class='post-comment-link'>
        <b:if cond='data:blog.pageType != &quot;item&quot;'>
          <b:if cond='data:post.allowComments'>
            <a class='comment-link' expr:href='data:post.addCommentUrl' expr:onclick='data:post.addCommentOnclick'><b:if cond='data:post.numComments == 1'>1 <data:top.commentLabel/><b:else/><data:post.numComments/> <data:top.commentLabelPlural/></b:if></a>
          </b:if>
        </b:if>
      </span> <span class='post-icons'>
        <!-- email post links -->
        <b:if cond='data:post.emailPostUrl'>
          <span class='item-action'>
          <a expr:href='data:post.emailPostUrl' expr:title='data:top.emailPostMsg'>
              <img alt='' class='icon-action' height='13' src='http://www.blogger.com/img/icon18_email.gif' width='18'/>
          </a>
          </span>
        </b:if>

        <!-- quickedit pencil -->
        <b:include data='post' name='postQuickEdit'/>
      </span> </div>

      <div class='post-footer-line post-footer-line-2'><span class='post-labels'>
        <b:if cond='data:post.labels'>
          <data:postLabelsLabel/>
          <b:loop values='data:post.labels' var='label'>
            <a expr:href='data:label.url' rel='tag'><data:label.name/></a><b:if cond='data:label.isLast != &quot;true&quot;'>,</b:if>
          </b:loop>
        </b:if>
      </span> </div>

      <div class='post-footer-line post-footer-line-3'/>
    </div>
  </div>
</b:includable>
            <b:includable id='postQuickEdit' var='post'>
  <b:if cond='data:post.editUrl'>
    <span expr:class='&quot;item-control &quot; + data:post.adminClass'>
      <a expr:href='data:post.editUrl' expr:title='data:top.editPostMsg'>
        <img alt='' class='icon-action' height='18' src='https://resources.blogblog.com/img/icon18_edit_allbkg.gif' width='18'/>
      </a>
    </span>
  </b:if>
</b:includable>
            <b:includable id='shareButtons' var='post'>
  <b:if cond='data:top.showEmailButton'><a class='goog-inline-block share-button sb-email' expr:href='data:post.sharePostUrl + &quot;&amp;target=email&quot;' expr:title='data:top.emailThisMsg' target='_blank'><span class='share-button-link-text'><data:top.emailThisMsg/></span></a></b:if><b:if cond='data:top.showBlogThisButton'><a class='goog-inline-block share-button sb-blog' expr:href='data:post.sharePostUrl + &quot;&amp;target=blog&quot;' expr:onclick='&quot;window.open(this.href, \&quot;_blank\&quot;, \&quot;height=270,width=475\&quot;); return false;&quot;' expr:title='data:top.blogThisMsg' target='_blank'><span class='share-button-link-text'><data:top.blogThisMsg/></span></a></b:if><b:if cond='data:top.showTwitterButton'><a class='goog-inline-block share-button sb-twitter' expr:href='data:post.sharePostUrl + &quot;&amp;target=twitter&quot;' expr:title='data:top.shareToTwitterMsg' target='_blank'><span class='share-button-link-text'><data:top.shareToTwitterMsg/></span></a></b:if><b:if cond='data:top.showFacebookButton'><a class='goog-inline-block share-button sb-facebook' expr:href='data:post.sharePostUrl + &quot;&amp;target=facebook&quot;' expr:onclick='&quot;window.open(this.href, \&quot;_blank\&quot;, \&quot;height=430,width=640\&quot;); return false;&quot;' expr:title='data:top.shareToFacebookMsg' target='_blank'><span class='share-button-link-text'><data:top.shareToFacebookMsg/></span></a></b:if><b:if cond='data:top.showPinterestButton'><a class='goog-inline-block share-button sb-pinterest' expr:href='data:post.sharePostUrl + &quot;&amp;target=pinterest&quot;' expr:title='data:top.shareToPinterestMsg' target='_blank'><span class='share-button-link-text'><data:top.shareToPinterestMsg/></span></a></b:if>
</b:includable>
            <b:includable id='status-message'>
  <b:if cond='data:navMessage'>
  <div class='status-msg-wrap'>
    <div class='status-msg-body'>
      <data:navMessage/>
    </div>
    <div class='status-msg-border'>
      <div class='status-msg-bg'>
        <div class='status-msg-hidden'><data:navMessage/></div>
      </div>
    </div>
  </div>
  <div style='clear: both;'/>
  </b:if>
</b:includable>
            <b:includable id='threaded-comment-form' var='post'>
  <div class='comment-form'>
    <a name='comment-form'/>
    <b:if cond='data:mobile'>
      <p><data:blogCommentMessage/></p>
      <data:blogTeamBlogMessage/>
      <a expr:href='data:post.commentFormIframeSrc' id='comment-editor-src'/>
      <iframe allowtransparency='true' class='blogger-iframe-colorize blogger-comment-from-post' expr:height='data:cmtIframeInitialHeight' frameborder='0' id='comment-editor' name='comment-editor' src='' style='display: none' width='100%'/>
    <b:else/>
      <p><data:blogCommentMessage/></p>
      <data:blogTeamBlogMessage/>
      <a expr:href='data:post.commentFormIframeSrc' id='comment-editor-src'/>
      <iframe allowtransparency='true' class='blogger-iframe-colorize blogger-comment-from-post' expr:height='data:cmtIframeInitialHeight' frameborder='0' id='comment-editor' name='comment-editor' src='' width='100%'/>
    </b:if>
    <data:post.cmtfpIframe/>
    <script type='text/javascript'>
      BLOG_CMT_createIframe(&#39;<data:post.appRpcRelayPath/>&#39;);
    </script>
  </div>
</b:includable>
            <b:includable id='threaded_comment_js' var='post'>
  <script async='async' expr:src='data:post.commentSrc' type='text/javascript'/>

  <script type='text/javascript'>
    (function() {
      var items = <data:post.commentJso/>;
      var msgs = <data:post.commentMsgs/>;
      var config = <data:post.commentConfig/>;

// <![CDATA[
      var cursor = null;
      if (items && items.length > 0) {
        cursor = parseInt(items[items.length - 1].timestamp) + 1;
      }

      var bodyFromEntry = function(entry) {
        var text = (entry &&
                    ((entry.content && entry.content.$t) ||
                     (entry.summary && entry.summary.$t))) ||
            '';
        if (entry && entry.gd$extendedProperty) {
          for (var k in entry.gd$extendedProperty) {
            if (entry.gd$extendedProperty[k].name == 'blogger.contentRemoved') {
              return '<span class="deleted-comment">' + text + '</span>';
            }
          }
        }
        return text;
      }

      var parse = function(data) {
        cursor = null;
        var comments = [];
        if (data && data.feed && data.feed.entry) {
          for (var i = 0, entry; entry = data.feed.entry[i]; i++) {
            var comment = {};
            // comment ID, parsed out of the original id format
            var id = /blog-(\d+).post-(\d+)/.exec(entry.id.$t);
            comment.id = id ? id[2] : null;
            comment.body = bodyFromEntry(entry);
            comment.timestamp = Date.parse(entry.published.$t) + '';
            if (entry.author && entry.author.constructor === Array) {
              var auth = entry.author[0];
              if (auth) {
                comment.author = {
                  name: (auth.name ? auth.name.$t : undefined),
                  profileUrl: (auth.uri ? auth.uri.$t : undefined),
                  avatarUrl: (auth.gd$image ? auth.gd$image.src : undefined)
                };
              }
            }
            if (entry.link) {
              if (entry.link[2]) {
                comment.link = comment.permalink = entry.link[2].href;
              }
              if (entry.link[3]) {
                var pid = /.*comments\/default\/(\d+)\?.*/.exec(entry.link[3].href);
                if (pid && pid[1]) {
                  comment.parentId = pid[1];
                }
              }
            }
            comment.deleteclass = 'item-control blog-admin';
            if (entry.gd$extendedProperty) {
              for (var k in entry.gd$extendedProperty) {
                if (entry.gd$extendedProperty[k].name == 'blogger.itemClass') {
                  comment.deleteclass += ' ' + entry.gd$extendedProperty[k].value;
                } else if (entry.gd$extendedProperty[k].name == 'blogger.displayTime') {
                  comment.displayTime = entry.gd$extendedProperty[k].value;
                }
              }
            }
            comments.push(comment);
          }
        }
        return comments;
      };

      var paginator = function(callback) {
        if (hasMore()) {
          var url = config.feed + '?alt=json&v=2&orderby=published&reverse=false&max-results=50';
          if (cursor) {
            url += '&published-min=' + new Date(cursor).toISOString();
          }
          window.bloggercomments = function(data) {
            var parsed = parse(data);
            cursor = parsed.length < 50 ? null
                : parseInt(parsed[parsed.length - 1].timestamp) + 1
            callback(parsed);
            window.bloggercomments = null;
          }
          url += '&callback=bloggercomments';
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = url;
          document.getElementsByTagName('head')[0].appendChild(script);
        }
      };
      var hasMore = function() {
        return !!cursor;
      };
      var getMeta = function(key, comment) {
        if ('iswriter' == key) {
          var matches = !!comment.author
              && comment.author.name == config.authorName
              && comment.author.profileUrl == config.authorUrl;
          return matches ? 'true' : '';
        } else if ('deletelink' == key) {
          return config.baseUri + '/comment/delete/'
               + config.blogId + '/' + comment.id;
        } else if ('deleteclass' == key) {
          return comment.deleteclass;
        }
        return '';
      };

      var replybox = null;
      var replyUrlParts = null;
      var replyParent = undefined;

      var onReply = function(commentId, domId) {
        if (replybox == null) {
          // lazily cache replybox, and adjust to suit this style:
          replybox = document.getElementById('comment-editor');
          if (replybox != null) {
            replybox.height = '250px';
            replybox.style.display = 'block';
            replyUrlParts = replybox.src.split('#');
          }
        }
        if (replybox && (commentId !== replyParent)) {
          replybox.src = '';
          document.getElementById(domId).insertBefore(replybox, null);
          replybox.src = replyUrlParts[0]
              + (commentId ? '&parentID=' + commentId : '')
              + '#' + replyUrlParts[1];
          replyParent = commentId;
        }
      };

      var hash = (window.location.hash || '#').substring(1);
      var startThread, targetComment;
      if (/^comment-form_/.test(hash)) {
        startThread = hash.substring('comment-form_'.length);
      } else if (/^c[0-9]+$/.test(hash)) {
        targetComment = hash.substring(1);
      }

      // Configure commenting API:
      var configJso = {
        'maxDepth': config.maxThreadDepth
      };
      var provider = {
        'id': config.postId,
        'data': items,
        'loadNext': paginator,
        'hasMore': hasMore,
        'getMeta': getMeta,
        'onReply': onReply,
        'rendered': true,
        'initComment': targetComment,
        'initReplyThread': startThread,
        'config': configJso,
        'messages': msgs
      };

      var render = function() {
        if (window.goog && window.goog.comments) {
          var holder = document.getElementById('comment-holder');
          window.goog.comments.render(holder, provider);
        }
      };

      // render now, or queue to render when library loads:
      if (window.goog && window.goog.comments) {
        render();
      } else {
        window.goog = window.goog || {};
        window.goog.comments = window.goog.comments || {};
        window.goog.comments.loadQueue = window.goog.comments.loadQueue || [];
        window.goog.comments.loadQueue.push(render);
      }
    })();
// ]]>
  </script>
</b:includable>
            <b:includable id='threaded_comments' var='post'>
  <div class='comments' id='comments'>
    <a name='comments'/>
    <h4><data:post.commentLabelFull/>:</h4>

    <div class='comments-content'>
      <b:include cond='data:post.embedCommentForm' data='post' name='threaded_comment_js'/>
      <div id='comment-holder'>
         <data:post.commentHtml/>
      </div>
    </div>

    <p class='comment-footer'>
      <b:if cond='data:post.allowNewComments'>
        <b:include data='post' name='threaded-comment-form'/>
      <b:else/>
        <data:post.noNewCommentsText/>
      </b:if>
    </p>

    <b:if cond='data:showCmtPopup'>
      <div id='comment-popup'>
        <iframe allowtransparency='true' frameborder='0' id='comment-actions' name='comment-actions' scrolling='no'>
        </iframe>
      </div>
    </b:if>

    <div id='backlinks-container'>
    <div expr:id='data:widget.instanceId + &quot;_backlinks-container&quot;'>
    </div>
    </div>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='AdSense6' locked='false' title='' type='AdSense'>
            <b:widget-settings>
              <b:widget-setting name='style.bgcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.textcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.layout'>1x1</b:widget-setting>
              <b:widget-setting name='style.bordercolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.urlcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.linkcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.unittype'>TextAndImage</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <div class='widget-content'>
    <data:adCode/>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
        </b:section>
      </div>

      <div id='sidebar-wrapper'>
        <b:section class='sidebar' id='sidebar' preferred='yes'>
          <b:widget id='BlogSearch1' locked='false' title='Поиск по этому блогу' type='BlogSearch'>
            <b:includable id='main'>
    <!-- only display title if it's non-empty -->
    <b:if cond='data:title != &quot;&quot;'>
      <h2 class='title'><data:title/></h2>
    </b:if>

    <div class='widget-content'>
      <div expr:id='data:widget.instanceId + &quot;_form&quot;'>
        <form class='gsc-search-box' expr:action='data:blog.searchUrl'>
          <b:attr cond='not data:view.isPreview' name='target' value='_top'/>
          <table cellpadding='0' cellspacing='0' class='gsc-search-box'>
            <tbody>
              <tr>
                <td class='gsc-input'>
                  <input autocomplete='off' class='gsc-input' expr:value='data:view.isSearch ? data:view.search.query.escaped : &quot;&quot;' name='q' size='10' title='search' type='text'/>
                </td>
                <td class='gsc-search-button'>
                  <input class='gsc-search-button' expr:value='data:messages.search' title='search' type='submit'/>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </div>

    <b:include name='quickedit'/>
  </b:includable>
          </b:widget>
          <b:widget id='HTML13' locked='false' title='ШОРТ недели' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<div style="position: relative; width: 100%; padding-top: 177.77%;">
  <iframe src="https://www.youtube.com/embed/TjVhCkAyWTo" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 12px;"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    title="YouTube Shorts">
  
</iframe></div>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='Label1' locked='false' title='Рубрики' type='Label'>
            <b:widget-settings>
              <b:widget-setting name='sorting'>ALPHA</b:widget-setting>
              <b:widget-setting name='display'>CLOUD</b:widget-setting>
              <b:widget-setting name='selectedLabelsList'>3D Вселенная,ESO50,ESOCAST,GOCE,Hubblecast,JWT,Nebulacast,VISTA,WISE,eClips,Анимации,Антиматерия,ВВС Ночное Небо,Взгляд в небо,Вот так новость,Галактика,Галактики,Гершель,Дети в космосе,ЕКА,Звезды,ИК-галерея,История,История телескопа,КЕК,Калтех,Кеплер,Кометы,Космология,Лаборатория Реактивного Движения,Луна,Любители,Марс,Меркурий,Мессье,Мессье и его звери,Млечный Путь,Мракобесие,НАСА,Новости,Новости сайта,Обсерватории,Окно во Вселенную,Планетарные туманности,Планк,Планы,Познай Вселенную,Популярно об Астрономии,Прекрасная Вселенная Чандры,Про Вселенную,Пульс Живой Вселенной,Пульсары,Путеводитель по Галактике,Путешествия,Рекомендую,Розетта,Сатурн,Сверхновые,Светопись,Свифт,Системное,Сказки на ночь,Скрытая Вселенная,События,Солнечная система,Солнце,Спитцер,Спроси Астронома,Стереоскоп,Темная Материя,Терскол,Ферми,Фото дня,Хаббл,Чандра,Черные дыры,Экзопланеты,ЮЕО,Юпитер</b:widget-setting>
              <b:widget-setting name='showType'>ALL</b:widget-setting>
              <b:widget-setting name='showFreqNumbers'>true</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <b:if cond='data:title != &quot;&quot;'>
    <h2><data:title/></h2>
  </b:if>
  <div expr:class='&quot;widget-content &quot; + data:display + &quot;-label-widget-content&quot;'>
    <b:if cond='data:display == &quot;list&quot;'>
      <ul>
        <b:loop values='data:labels' var='label'>
          <li>
            <b:if cond='data:blog.url == data:label.url'>
              <span expr:dir='data:blog.languageDirection'><data:label.name/></span>
            <b:else/>
              <a expr:dir='data:blog.languageDirection' expr:href='data:label.url'><data:label.name/></a>
            </b:if>
            <b:if cond='data:showFreqNumbers'>
              <span dir='ltr'>(<data:label.count/>)</span>
            </b:if>
          </li>
        </b:loop>
      </ul>
    <b:else/>
      <b:loop values='data:labels' var='label'>
        <span expr:class='&quot;label-size label-size-&quot; + data:label.cssSize'>
          <b:if cond='data:blog.url == data:label.url'>
            <span expr:dir='data:blog.languageDirection'><data:label.name/></span>
          <b:else/>
            <a expr:dir='data:blog.languageDirection' expr:href='data:label.url'><data:label.name/></a>
          </b:if>
          <b:if cond='data:showFreqNumbers'>
            <span class='label-count' dir='ltr'>(<data:label.count/>)</span>
          </b:if>
        </span>
      </b:loop>
    </b:if>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='HTML2' locked='false' title='Телевизор' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<iframe width="100%" height="315" src="https://www.youtube.com/embed/videoseries?si=NoC0ujjAde2ofC_Q&amp;list=PLTwmObcoplqk6DmnG5mvYuD92-wwab8mQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"  style="border: none; height: 265px; width: 100%;" allowfullscreen></iframe>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='BlogArchive1' locked='false' title='Содержание' type='BlogArchive'>
            <b:widget-settings>
              <b:widget-setting name='showStyle'>HIERARCHY</b:widget-setting>
              <b:widget-setting name='yearPattern'>yyyy</b:widget-setting>
              <b:widget-setting name='showWeekEnd'>true</b:widget-setting>
              <b:widget-setting name='monthPattern'>MMMM</b:widget-setting>
              <b:widget-setting name='dayPattern'>MMM dd</b:widget-setting>
              <b:widget-setting name='weekPattern'>MM/dd</b:widget-setting>
              <b:widget-setting name='chronological'>false</b:widget-setting>
              <b:widget-setting name='showPosts'>true</b:widget-setting>
              <b:widget-setting name='frequency'>MONTHLY</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <b:if cond='data:title != &quot;&quot;'>
    <h2><data:title/></h2>
  </b:if>
  <div class='widget-content'>
  <div id='ArchiveList'>
  <div expr:id='data:widget.instanceId + &quot;_ArchiveList&quot;'>
    <b:include cond='data:style == &quot;HIERARCHY&quot;' data='data' name='interval'/>
    <b:include cond='data:style == &quot;FLAT&quot;' data='data' name='flat'/>
    <b:include cond='data:style == &quot;MENU&quot;' data='data' name='menu'/>
  </div>
  </div>
  <b:include name='quickedit'/>
  </div>
</b:includable>
            <b:includable id='flat' var='data'>
  <ul class='flat'>
    <b:loop values='data:data' var='i'>
      <li class='archivedate'>
        <a expr:href='data:i.url'><data:i.name/></a> (<data:i.post-count/>)
      </li>
    </b:loop>
  </ul>
</b:includable>
            <b:includable id='interval' var='intervalData'>
  <b:loop values='data:intervalData' var='interval'>
    <ul class='hierarchy'>
      <li expr:class='&quot;archivedate &quot; + data:interval.expclass'>
        <b:include cond='data:interval.toggleId' data='interval' name='toggle'/>
        <a class='post-count-link' expr:href='data:interval.url'>
          <data:interval.name/>
        </a>
        <span class='post-count' dir='ltr'>(<data:interval.post-count/>)</span>
        <b:include cond='data:interval.data' data='interval.data' name='interval'/>
        <b:include cond='data:interval.posts' data='interval.posts' name='posts'/>
      </li>
    </ul>
  </b:loop>
</b:includable>
            <b:includable id='menu' var='data'>
  <select expr:id='data:widget.instanceId + &quot;_ArchiveMenu&quot;'>
    <option value=''><data:title/></option>
    <b:loop values='data:data' var='i'>
      <option expr:value='data:i.url'><data:i.name/> (<data:i.post-count/>)</option>
    </b:loop>
  </select>
</b:includable>
            <b:includable id='posts' var='posts'>
  <ul class='posts'>
    <b:loop values='data:posts' var='post'>
      <li><a expr:href='data:post.url'><data:post.title/></a></li>
    </b:loop>
  </ul>
</b:includable>
            <b:includable id='toggle' var='interval'>
  <a class='toggle' href='javascript:void(0)'>
    <span expr:class='&quot;zippy&quot; + (data:interval.expclass == &quot;expanded&quot; ? &quot; toggle-open&quot; : &quot;&quot;)'>
      <b:if cond='data:interval.expclass == &quot;expanded&quot;'>
        &#9660;&#160;
      <b:elseif cond='data:blog.languageDirection == &quot;rtl&quot;'/>
        &#9668;&#160;
      <b:else/>
        &#9658;&#160;
      </b:if>
    </span>
  </a>
</b:includable>
          </b:widget>
          <b:widget id='AdSense3' locked='false' title='' type='AdSense'>
            <b:widget-settings>
              <b:widget-setting name='style.bgcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.textcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.layout'>1x1</b:widget-setting>
              <b:widget-setting name='style.bordercolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.urlcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.linkcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.unittype'>TextAndImage</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <div class='widget-content'>
    <data:adCode/>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='HTML6' locked='false' title='ГОРЯЧЕНЬКОЕ в Телеграм!' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<script async="async" src="https://telegram.org/js/telegram-widget.js?22" data-telegram-post="liveuniverse/1504" data-width="100%" data-dark="1" data-align="center">
</script>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='AdSense2' locked='false' title='' type='AdSense'>
            <b:widget-settings>
              <b:widget-setting name='style.bgcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.textcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.layout'>1x1</b:widget-setting>
              <b:widget-setting name='style.bordercolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.urlcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.linkcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.unittype'>TextAndImage</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <div class='widget-content'>
    <data:adCode/>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='HTML3' locked='false' title='Мы ВКонтакте' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<script type="text/javascript" src="https://vk.com/js/api/openapi.js?160"></script>

<!-- VK Widget -->
<div id="vk_groups" style="clear: both; text-align: center;"></div>
<script type="text/javascript">
VK.Widgets.Group("vk_groups", {mode: 4, wide: 1, width: "350", height: "400", color1: '080808', color2: 'B6BFC3', color3: '699EDA'}, 94957605);
</script>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='AdSense1' locked='false' title='' type='AdSense'>
            <b:widget-settings>
              <b:widget-setting name='style.bgcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.textcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.layout'>1x1</b:widget-setting>
              <b:widget-setting name='style.bordercolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.urlcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.linkcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.unittype'>TextAndImage</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <div class='widget-content'>
    <data:adCode/>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='HTML10' locked='false' title='ГОРЯЧЕНЬКОЕ из Твиттера' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">This is to remind that starry sky is still the best show in the world <a href="https://t.co/JmAtq4pusk">pic.twitter.com/JmAtq4pusk</a></p>&mdash; Live!Universe (@DrMichaelVideos) <a href="https://twitter.com/DrMichaelVideos/status/1980921694010429683?ref_src=twsrc%5Etfw">October 22, 2025</a></blockquote> <script async="async" src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='AdSense4' locked='false' title='' type='AdSense'>
            <b:widget-settings>
              <b:widget-setting name='style.bgcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.textcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.layout'>160x600</b:widget-setting>
              <b:widget-setting name='style.bordercolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.urlcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.linkcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.unittype'>TextAndImage</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <div class='widget-content'>
    <data:adCode/>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='Followers1' locked='false' title='Постоянные читатели' type='Followers'>
            <b:widget-settings>
              <b:widget-setting name='borderColorTransparent'>true</b:widget-setting>
              <b:widget-setting name='useTemplateDefaultStyles'>true</b:widget-setting>
              <b:widget-setting name='contentSecondaryTextColor'>#000000</b:widget-setting>
              <b:widget-setting name='contentHeadlineColor'>#000000</b:widget-setting>
              <b:widget-setting name='endcapTextColor'>#cccccc</b:widget-setting>
              <b:widget-setting name='contentTextColor'>#cccccc</b:widget-setting>
              <b:widget-setting name='contentSecondaryLinkColor'>#FFFFFF</b:widget-setting>
              <b:widget-setting name='endcapLinkColor'>#000000</b:widget-setting>
              <b:widget-setting name='contentLinkColor'>#000000</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <b:if cond='data:title != &quot;&quot; and data:codeSnippet != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <div expr:id='data:widget.instanceId + &quot;-wrapper&quot;'>
      <b:if cond='data:codeSnippet != &quot;&quot;'>
        <div style='margin-right:2px;'>
          <data:codeSnippet/>
        </div>
      </b:if>
    </div>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='AdSense5' locked='false' title='' type='AdSense'>
            <b:widget-settings>
              <b:widget-setting name='style.bgcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.textcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.layout'>300x250</b:widget-setting>
              <b:widget-setting name='style.bordercolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.urlcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.linkcolor'>#ffffff</b:widget-setting>
              <b:widget-setting name='style.unittype'>TextAndImage</b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <div class='widget-content'>
    <data:adCode/>
    <b:include name='quickedit'/>
  </div>
</b:includable>
          </b:widget>
          <b:widget id='HTML5' locked='false' title='Astronomical Weather' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<div style="width:100%;max-width:100%;margin:0;padding:0;overflow:hidden;box-sizing:border-box;">
  <div id="nc-weather-widget"></div>
<style>
#nc-weather-widget,
#nc-weather-widget iframe {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}
</style>
  <script src="https://staging.nebulacast.app/weather/embed-vertical.js"
          data-lat="52.2297"
          data-lon="21.0122"
          data-tz="Europe/Warsaw"
          data-name="Warsaw"
          data-width="100%"
          data-height="600"
          data-debug="true"></script>
</div>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='HTML4' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<div id="nrw-root-9f3a1">
  <div class="nrw-header">
    <div class="nrw-title">News Radar</div>
    <div class="nrw-meta"><a class="nrw-rss" href="https://staging.nebulacast.app/news/rss.xml" target="_blank" rel="noopener">RSS</a></div>
  </div>
  <div class="nrw-filters" data-role="filters"></div>
  <div class="nrw-status" data-role="status">Loading...</div>
  <div class="nrw-list" data-role="list"></div>
</div>

<style>
#nrw-root-9f3a1 {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  max-width: 100%;
  margin: 0;
  padding: 0;
  background: #0f1115;
  color: #e6e6e6;
}
#nrw-root-9f3a1 .nrw-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #2a2f3a;
  margin-bottom: 12px;
}
#nrw-root-9f3a1 .nrw-title {
  font-weight: 700;
  font-size: 18px;
  color: #e6f2ff;
  margin: 0;
}
#nrw-root-9f3a1 .nrw-meta {
  font-size: 12px;
}
#nrw-root-9f3a1 .nrw-rss {
  color: #8fb6ff;
  text-decoration: none;
}
#nrw-root-9f3a1 .nrw-rss:hover {
  text-decoration: underline;
}
#nrw-root-9f3a1 .nrw-status {
  padding: 8px 0;
  font-size: 13px;
  color: #9aa3b2;
  text-align: center;
}
#nrw-root-9f3a1 .nrw-error {
  padding: 16px;
  background: #1a1f2a;
  border: 1px solid #3a4252;
  border-radius: 8px;
  color: #e6e6e6;
  font-size: 13px;
  line-height: 1.5;
  margin: 12px 0;
}
#nrw-root-9f3a1 .nrw-error-title {
  font-weight: 700;
  color: #ff6b6b;
  margin-bottom: 8px;
}
#nrw-root-9f3a1 .nrw-error-hint {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #2a2f3a;
  font-size: 12px;
  color: #9aa3b2;
}
#nrw-root-9f3a1 .nrw-error-code {
  font-family: monospace;
  background: #0f1115;
  padding: 2px 6px;
  border-radius: 4px;
  color: #8fb6ff;
}
#nrw-root-9f3a1 .nrw-list {
  margin: 0;
  padding: 0;
}
#nrw-root-9f3a1 .nrw-card {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #2a2f3a;
  align-items: flex-start;
}
#nrw-root-9f3a1 .nrw-card:last-child {
  border-bottom: none;
}
#nrw-root-9f3a1 .nrw-thumb {
  width: 120px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid #2a2f3a;
  background: #111623;
}
#nrw-root-9f3a1 .nrw-content {
  flex: 1;
  min-width: 0;
}
#nrw-root-9f3a1 .nrw-titlelink {
  display: block;
  font-weight: 700;
  font-size: 14px;
  line-height: 1.4;
  color: #e6f2ff;
  text-decoration: none;
  margin-bottom: 6px;
}
#nrw-root-9f3a1 .nrw-titlelink:hover {
  color: #8fb6ff;
  text-decoration: underline;
}
#nrw-root-9f3a1 .nrw-metaRow {
  font-size: 11px;
  color: #9aa3b2;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
#nrw-root-9f3a1 .nrw-date {
  color: #9aa3b2;
}
#nrw-root-9f3a1 .nrw-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #2a2f3a;
  color: #cfe2ff;
  text-transform: uppercase;
  font-weight: 600;
  border: 1px solid #3a4252;
}
#nrw-root-9f3a1 .nrw-snippet {
  margin-top: 6px;
  line-height: 1.35;
  font-size: 12px;
  color: #cfe2ff;
  margin-bottom: 6px;
}
#nrw-root-9f3a1 .nrw-more {
  display: inline-block;
  margin-top: 6px;
  font-size: 11px;
  color: #8fb6ff;
  text-decoration: none;
  white-space: nowrap;
}
#nrw-root-9f3a1 .nrw-more:hover {
  text-decoration: underline;
}
#nrw-root-9f3a1 .nrw-filters{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  padding:10px 0 12px 0;
  border-bottom:1px solid #2a2f3a;
  margin-bottom:12px;
}
#nrw-root-9f3a1 .nrw-filter{
  appearance:none;
  border:1px solid #2a2f3a;
  background:#111623;
  color:#cfe2ff;
  font-size:12px;
  padding:6px 10px;
  border-radius:999px;
  cursor:pointer;
  line-height:1;
  user-select:none;
}
#nrw-root-9f3a1 .nrw-filter:hover{
  border-color:#3a4252;
  color:#e6f2ff;
}
#nrw-root-9f3a1 .nrw-filter.is-active{
  background:#2a2f3a;
  border-color:#3a4252;
  color:#e6f2ff;
}
</style>

<script>
(function() {
  'use strict';
  
  const ROOT_ID = 'nrw-root-9f3a1';
  const rssUrl = "https://staging.nebulacast.app/news/rss.xml?ts=" + Date.now();
  const MAX_ITEMS = 10; // How many items to show on screen
  const PARSE_MAX = 300; // Maximum items to parse from RSS (0 = no limit)
  const USE_PROXY = false; // If true, always use proxy. If false, try direct first, then auto-fallback to proxy.
  const PROXY_URL = "https://api.allorigins.win/raw?url=";
  const FILTERS = ["All", "News", "Science", "Videos", "Images", "Nebulacast"];
  const STORAGE_KEY = ROOT_ID + ":filter";
  const FETCH_TIMEOUT = 30000; // 30 seconds timeout
  let activeFilter = "All";
  let cachedItems = []; // items as DOM nodes (from parsed XML) - ALL items, not limited
  
  function getRoot() {
    return document.getElementById(ROOT_ID);
  }
  
  function getStatusEl() {
    const root = getRoot();
    return root ? root.querySelector('[data-role="status"]') : null;
  }
  
  function getListEl() {
    const root = getRoot();
    return root ? root.querySelector('[data-role="list"]') : null;
  }
  
  function getFiltersEl() {
    const root = getRoot();
    return root ? root.querySelector('[data-role="filters"]') : null;
  }

  function normCat(s) {
    return (s || "").trim().toLowerCase();
  }

  function readCategory(item) {
    const c = item.querySelector('category');
    return c ? (c.textContent || "").trim().toLowerCase() : "";
  }

  function youtubeThumbnailUrl(url) {
    if (!url) return null;
    // Extract video ID from various YouTube URL formats
    // watch?v=ID, embed/ID, v/ID, shorts/ID, youtu.be/ID, youtube.com/v/ID
    var patterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (var i = 0; i < patterns.length; i++) {
      var match = url.match(patterns[i]);
      if (match && match[1]) {
        return 'https://img.youtube.com/vi/' + match[1] + '/hqdefault.jpg';
      }
    }
    return null;
  }

  function loadSavedFilter() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v && FILTERS.map(normCat).includes(normCat(v))) activeFilter = v;
    } catch {}
  }

  function saveFilter(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
  }

  function renderFilters() {
    const el = getFiltersEl();
    if (!el) return;

    el.innerHTML = "";
    FILTERS.forEach(function(label) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nrw-filter" + (normCat(label) === normCat(activeFilter) ? " is-active" : "");
      btn.textContent = label;

      btn.addEventListener("click", function() {
        activeFilter = label;
        saveFilter(activeFilter);
        renderFilters();
        applyFilterAndRender();
      });

      el.appendChild(btn);
    });
  }

  function applyFilterAndRender() {
    // Check if we have cached items
    if (!cachedItems || cachedItems.length === 0) {
      return; // Don't render if no items cached yet
    }
    
    const f = normCat(activeFilter);
    let filtered = cachedItems;

    // Filter by category if not "all"
    if (f !== "all") {
      filtered = cachedItems.filter(function(it) {
        const cat = readCategory(it);
        return cat === f;
      });
    }

    // Limit to MAX_ITEMS after filtering
    const items = Array.prototype.slice.call(filtered, 0, MAX_ITEMS);
    renderItems(items);
  }
  
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function decodeHtmlEntities(str) {
    if (!str) return '';
    // Decode in two passes to handle partially decoded strings
    let decoded = str;
    for (let i = 0; i < 2; i++) {
      const txt = document.createElement('textarea');
      txt.innerHTML = decoded;
      decoded = txt.value;
    }
    // Additional cleanup: replace all variants of ellipsis entities
    // Handle both with and without semicolon, and double-escaped versions
    decoded = decoded.replace(/&amp;#8230;/gi, '...');
    decoded = decoded.replace(/&amp;#8230/gi, '...');
    decoded = decoded.replace(/&#8230;/gi, '...');
    decoded = decoded.replace(/&#8230/gi, '...');
    decoded = decoded.replace(/&amp;hellip;/gi, '...');
    decoded = decoded.replace(/&amp;hellip/gi, '...');
    decoded = decoded.replace(/&hellip;/gi, '...');
    decoded = decoded.replace(/&hellip/gi, '...');
    // Normalize: replace ellipsis character with three dots
    decoded = decoded.replace(/…/g, '...');
    return decoded;
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
  
  function truncateText(text, maxLen) {
    if (!text) return '';
    maxLen = maxLen || 220;
    const trimmed = text.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return trimmed.substring(0, maxLen).trim() + '...';
  }
  
  function normalizeDescriptionHTML(s) {
    if (!s) return '';
    return s
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\n/g, "\n");
  }
  
  function extractThumbnailAndSnippet(descriptionHTML) {
    if (!descriptionHTML) return { thumb: null, snippet: '' };
    
    const tmp = document.createElement('div');
    tmp.innerHTML = normalizeDescriptionHTML(descriptionHTML);
    
    const img = tmp.querySelector('img');
    let thumb = null;
    if (img) {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:image/svg+xml')) {
        // Check if it's a YouTube embed URL and convert to thumbnail
        const ytThumb = youtubeThumbnailUrl(src);
        thumb = ytThumb || src;
      }
    }
    
    const snippetEl = tmp.querySelector('.snippet');
    let snippetText = '';
    if (snippetEl) {
      const moreLink = snippetEl.querySelector('a.more');
      if (moreLink) {
        moreLink.remove();
      }
      snippetText = snippetEl.textContent || snippetEl.innerText || '';
      snippetText = decodeHtmlEntities(snippetText);
    } else {
      const clone = tmp.cloneNode(true);
      clone.querySelectorAll('a').forEach(function(a) { a.remove(); });
      snippetText = clone.textContent || clone.innerText || '';
      snippetText = decodeHtmlEntities(snippetText);
    }
    
    return {
      thumb: thumb,
      snippet: truncateText(snippetText, 220)
    };
  }
  
  function renderCard(item) {
    const title = (item.querySelector('title') && item.querySelector('title').textContent) || '';
    const link = (item.querySelector('link') && item.querySelector('link').textContent) || '';
    const pubDate = (item.querySelector('pubDate') && item.querySelector('pubDate').textContent) || '';
    const category = (item.querySelector('category') && item.querySelector('category').textContent) || '';
    const descriptionHTML = (item.querySelector('description') && item.querySelector('description').textContent) || '';
    
    const { thumb, snippet } = extractThumbnailAndSnippet(descriptionHTML);
    
    const card = document.createElement('div');
    card.className = 'nrw-card';
    
    let thumbHTML = '';
    if (thumb) {
      thumbHTML = '<img class="nrw-thumb" src="' + escapeHtml(thumb) + '" alt="" loading="lazy">';
    }
    
    const badgeHTML = category 
      ? '<span class="nrw-badge">' + escapeHtml(category) + '</span>'
      : '';
    
    const dateHTML = pubDate 
      ? '<span class="nrw-date">' + formatDate(pubDate) + '</span>'
      : '';
    
    // Build card structure without snippet (snippet will be inserted via textContent)
    card.innerHTML = 
      thumbHTML +
      '<div class="nrw-content">' +
        '<a class="nrw-titlelink" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(title) +
        '</a>' +
        '<div class="nrw-metaRow">' +
          dateHTML +
          badgeHTML +
        '</div>' +
        '<a class="nrw-more" href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">more »</a>' +
      '</div>';
    
    // Insert snippet via textContent (safe, no HTML entities issues)
    if (snippet) {
      const content = card.querySelector('.nrw-content');
      const moreLink = content.querySelector('.nrw-more');
      const snippetDiv = document.createElement('div');
      snippetDiv.className = 'nrw-snippet';
      snippetDiv.textContent = snippet;
      content.insertBefore(snippetDiv, moreLink);
    }
    
    return card;
  }
  
  function showStatus(text) {
    const statusEl = getStatusEl();
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.style.display = 'block';
    }
  }
  
  function hideStatus() {
    const statusEl = getStatusEl();
    if (statusEl) {
      statusEl.style.display = 'none';
    }
  }
  
  function showError(error) {
    const root = getRoot();
    if (!root) return;
    
    hideStatus();
    
    const errorMsg = error.message || 'Unknown error';
    
    const errorHTML = 
      '<div class="nrw-error">' +
        '<div class="nrw-error-title">RSS fetch failed</div>' +
        '<div>' + escapeHtml(errorMsg) + '</div>' +
        '<div class="nrw-error-hint">' +
          '<strong>Both direct fetch and proxy attempts failed.</strong><br>' +
          'The widget tried both methods automatically. If you want to force proxy usage, set:<br>' +
          '<span class="nrw-error-code">const USE_PROXY = true;</span>' +
        '</div>' +
      '</div>';
    
    const listEl = getListEl();
    if (listEl) {
      listEl.innerHTML = errorHTML;
    }
  }
  
  function renderItems(items) {
    const listEl = getListEl();
    if (!listEl) return;
    
    hideStatus();
    listEl.innerHTML = '';
    
    if (items.length === 0) {
      listEl.innerHTML = '<div class="nrw-error">No items found in RSS feed.</div>';
      return;
    }
    
    items.forEach(function(item) {
      const card = renderCard(item);
      listEl.appendChild(card);
    });
  }
  
  function buildUrl(useProxy) {
    return useProxy ? PROXY_URL + encodeURIComponent(rssUrl) : rssUrl;
  }
  
  function fetchText(url, useProxy) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function() {
      controller.abort();
    }, FETCH_TIMEOUT);
    
    return fetch(url, {
      signal: controller.signal
    })
      .then(function(response) {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        return response.text();
      })
      .then(function(text) {
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response');
        }
        return text;
      })
      .catch(function(error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout after ' + (FETCH_TIMEOUT / 1000) + ' seconds');
        }
        throw error;
      });
  }
  
  function parseXML(text) {
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      throw new Error('Failed to parse RSS XML: ' + (parseError.textContent || 'Invalid XML'));
    }
    return xml;
  }
  
  function loadRSS() {
    const root = getRoot();
    if (!root) {
      console.error('News Radar Widget: root element not found');
      return;
    }
    
    // Initialize with error handling - don't block RSS loading if filters fail
    try {
      showStatus('Loading...');
    } catch (e) {
      console.warn('Failed to show status:', e);
    }
    
    try {
      loadSavedFilter();
    } catch (e) {
      console.warn('Failed to load saved filter:', e);
    }
    
    try {
      renderFilters();
    } catch (e) {
      console.warn('Failed to render filters:', e);
    }
    
    // If USE_PROXY is true, skip direct fetch and go straight to proxy
    if (USE_PROXY) {
      fetchText(buildUrl(true), true)
        .then(function(text) {
          const xml = parseXML(text);
          const allItems = Array.prototype.slice.call(xml.querySelectorAll('item'));
          cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems;
          applyFilterAndRender();
        })
        .catch(function(error) {
          console.error('News Radar Widget error (proxy):', error);
          showError(error);
        });
      return;
    }
    
    // Try direct fetch first
    fetchText(buildUrl(false), false)
      .then(function(text) {
        try {
          const xml = parseXML(text);
          const allItems = Array.prototype.slice.call(xml.querySelectorAll('item'));
          cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems;
          applyFilterAndRender();
        } catch (parseError) {
          // Direct parse failed, retry via proxy
          console.warn('Direct parse failed, retry via proxy:', parseError);
          return fetchText(buildUrl(true), true)
            .then(function(proxyText) {
              const xml = parseXML(proxyText);
              const allItems = Array.prototype.slice.call(xml.querySelectorAll('item'));
              cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems;
              applyFilterAndRender();
            })
            .catch(function(proxyError) {
              console.error('News Radar Widget error (both attempts failed):', proxyError);
              showError(proxyError);
            });
        }
      })
      .catch(function(error) {
        // Direct fetch failed, retry via proxy
        console.warn('Direct RSS fetch failed, retry via proxy:', error);
        fetchText(buildUrl(true), true)
          .then(function(proxyText) {
            try {
              const xml = parseXML(proxyText);
              const allItems = Array.prototype.slice.call(xml.querySelectorAll('item'));
              cachedItems = PARSE_MAX ? allItems.slice(0, PARSE_MAX) : allItems;
              applyFilterAndRender();
            } catch (parseError) {
              console.error('News Radar Widget error (proxy parse failed):', parseError);
              showError(parseError);
            }
          })
          .catch(function(proxyError) {
            console.error('News Radar Widget error (both attempts failed):', proxyError);
            showError(proxyError);
          });
      });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRSS);
  } else {
    loadRSS();
  }
})();
</script>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='HTML8' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<iframe
  src="https://staging.nebulacast.app/sky/alerts.html"
  width="100%"
  height="600px"
  frameborder="0"
  style="border:none;display:block;"
  title="Space Alerts"
></iframe
>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='HTML14' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<!-- Nebulacast · Space Weather widget -->
<div id="helio-4pfd3o"></div>

<script src="https://staging.nebulacast.app/helio/dist/helio.widget.js"></script>
<script>
(function() {
  var el = document.getElementById("helio-4pfd3o");
  window.HelioWidget.mount(el, {
    dataUrl: "https://staging.nebulacast.app/data/helio_now.json"
  });
})();
</script>]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='Subscribe1' locked='false' title='Подписаться на RSS Feed' type='Subscribe'>
            <b:includable id='main'>
  <div style='white-space:nowrap'>
    <b:if cond='data:title != &quot;&quot;'>
      <h2 class='title'><data:title/></h2>
    </b:if>
    <div class='widget-content'>
      <b:loop values='data:feeds' var='feed'>
        <div expr:class='&quot;subscribe-wrapper subscribe-type-&quot; + data:feed.type'>

          <div expr:class='&quot;subscribe expanded subscribe-type-&quot; + data:feed.type' expr:id='&quot;SW_READER_LIST_&quot; + data:widgetId + data:feed.type' style='display:none;'>
            <div class='top'>
              <span class='inner' expr:onclick='&quot;return(_SW_toggleReaderList(event, \&quot;&quot; + data:widgetId +data:feed.type + &quot;\&quot;));&quot;'>
                <img class='subscribe-dropdown-arrow' expr:src='data:arrowDropdownImg'/>
                <img align='absmiddle' alt='' border='0' class='feed-icon' expr:src='data:feedIconImg'/>
                <data:feed.title/>
              </span>

              <div class='feed-reader-links'>
                <a class='feed-reader-link' expr:href='&quot;https://www.netvibes.com/subscribe.php?url=&quot; + data:feed.encodedUrl' target='_blank'>
                  <img expr:src='data:imagePathBase + &quot;subscribe-netvibes.png&quot;'/>
                </a>
                <a class='feed-reader-link' expr:href='&quot;https://add.my.yahoo.com/content?url=&quot; + data:feed.encodedUrl' target='_blank'>
                  <img expr:src='data:imagePathBase + &quot;subscribe-yahoo.png&quot;'/>
                </a>
                <a class='feed-reader-link' expr:href='data:feed.url' target='_blank'>
                  <img align='absmiddle' class='feed-icon' expr:src='data:feedIconImg'/>
                  Atom
                </a>
              </div>

            </div>
            <div class='bottom'/>
          </div>

          <div class='subscribe' expr:id='&quot;SW_READER_LIST_CLOSED_&quot; + data:widgetId +data:feed.type' expr:onclick='&quot;return(_SW_toggleReaderList(event, \&quot;&quot; + data:widgetId +data:feed.type + &quot;\&quot;));&quot;'>
            <div class='top'>
               <span class='inner'>
                 <img class='subscribe-dropdown-arrow' expr:src='data:arrowDropdownImg'/>
                 <span expr:onclick='&quot;return(_SW_toggleReaderList(event, \&quot;&quot; + data:widgetId +data:feed.type + &quot;\&quot;));&quot;'>
                   <img align='absmiddle' alt='' border='0' class='feed-icon' expr:src='data:feedIconImg'/>
                   <data:feed.title/>
                 </span>
               </span>
             </div>
            <div class='bottom'/>
          </div>

        </div>
      </b:loop>

      <div style='clear:both'/>

    </div>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
          <b:widget id='HTML1' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<!--LiveInternet counter--><script type="text/javascript"><!--
document.write("<a href='http://www.liveinternet.ru/click' "+
"target=_blank><img src='http://counter.yadro.ru/hit?t38.6;r"+
escape(document.referrer)+((typeof(screen)=="undefined")?"":
";s"+screen.width+"*"+screen.height+"*"+(screen.colorDepth?
screen.colorDepth:screen.pixelDepth))+";u"+escape(document.URL)+
";"+Math.random()+
"' alt='' title='LiveInternet' "+
"border=0 width=31 height=31><\/a>")//--></script><!--/LiveInternet-->]]></b:widget-setting>
            </b:widget-settings>
            <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
          </b:widget>
        </b:section>
      </div>

      <!-- spacer for skins that want sidebar and main to be the same height-->
      <div class='clear'>&#160;</div>

    </div> <!-- end content-wrapper -->

    <div id='footer-wrapper'>
      <b:section class='footer' id='footer'/>
    </div>

  </div></div> <!-- end outer-wrapper -->

<script type='text/javascript'>
var gaJsHost = ((&quot;https:&quot; == document.location.protocol) ? &quot;https://ssl.&quot; : &quot;http://www.&quot;);
document.write(unescape(&quot;%3Cscript src=&#39;&quot; + gaJsHost + &quot;google-analytics.com/ga.js&#39; type=&#39;text/javascript&#39;%3E%3C/script%3E&quot;));
</script>
<script type='text/javascript'>
var pageTracker = _gat._getTracker(&quot;UA-6848391-1&quot;);
pageTracker._initData();
pageTracker._trackPageview();
</script>
    
<svg aria-hidden='true' focusable='false' height='0' style='position:absolute;width:0;height:0;overflow:hidden' width='0'>

  <defs>

    <!-- FILTERS -->

    <filter height='160%' id='sa-btn-glow' width='160%' x='-30%' y='-30%'>

      <feGaussianBlur result='b' stdDeviation='3'/>

      <feMerge>
        <feMergeNode in='b'/>
        <feMergeNode in='SourceGraphic'/>
      </feMerge>

    </filter>

    <filter height='140%' id='sa-btn-glow-soft' width='140%' x='-20%' y='-20%'>

      <feGaussianBlur result='b' stdDeviation='1.5'/>

      <feMerge>
        <feMergeNode in='b'/>
        <feMergeNode in='SourceGraphic'/>
      </feMerge>

    </filter>

    <!-- BUTTON TEMPLATE -->

    <symbol id='sa-hud-button-template' viewBox='0 0 420 80'>

      <!-- MAIN SECTION -->

      <polygon fill='#0d1e30' points='34,12 295,12 330,68 52,68'/>

      <!-- RIGHT SECTION -->

      <polygon fill='#142840' points='290,12 360,12 395,68 325,68'/>

      <!-- OUTER FRAME -->

      <polygon fill='none' filter='url(#sa-btn-glow)' points='34,12 360,12 395,68 52,68' stroke='#1ab8f0' stroke-width='2.5'/>

      <!-- INNER FRAME -->

      <polygon fill='none' opacity='0.5' points='43,18 357,18 384,62 58,62' stroke='#1ab8f0' stroke-width='1'/>

      <!-- SECTION DIVIDER -->

      <line opacity='0.7' stroke='#1ab8f0' stroke-width='1.5' x1='290' x2='326' y1='12' y2='68'/>

      <line opacity='0.35' stroke='#1ab8f0' stroke-width='0.7' x1='290' x2='326' y1='12' y2='68'/>

      <!-- CHEVRON -->

      <polyline fill='none' filter='url(#sa-btn-glow-soft)' points='331,32 342,48 353,32' stroke='#1ab8f0' stroke-linecap='round' stroke-linejoin='round' stroke-width='3'/>

      <polyline fill='none' filter='url(#sa-btn-glow)' opacity='0.2' points='331,32 342,48 353,32' stroke='#1ab8f0' stroke-linecap='round' stroke-linejoin='round' stroke-width='7'/>

    </symbol>

  </defs>

</svg>
    
</body>
</html>